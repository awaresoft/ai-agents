---
name: logging
description: Logging with Pino in Fastify
metadata:
  tags: logging, pino, debugging, observability
---

# Logging with Pino

## House Rules

- Fastify's `logger: true` IS Pino — never bolt on winston/console. Use `request.log` in handlers/hooks (carries the request ID automatically), `app.log` outside requests.
- **Structured only:** `request.log.info({ userId: user.id, action }, "User action")` — never string interpolation. Errors go under the `err` key (`{ err: error }`) so Pino's error serializer captures stack + cause.
- Per-environment: production = plain JSON at `info` (no transport); development = `pino-pretty` transport at `debug`; tests = `logger: false`.

## Redaction Is Mandatory

Configure at boot, before any request:

```typescript
const app = Fastify({
  logger: {
    level: "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.password",
        "*.secret",
        "*.token",
      ],
      censor: "[REDACTED]",
    },
  },
});
```

## Serializers Trim the Noise

The default `req` serializer logs a lot; override to log only what you query on, and add domain serializers so logging a rich object never leaks fields:

```typescript
logger: {
  serializers: {
    req: (request) => ({
      method: request.method,
      url: request.url,
      remoteAddress: request.ip,
    }),
    user: (user) => ({ id: user.id, email: user.email }),
  },
}
```

Serializers apply by KEY — `request.log.info({ user })` triggers the `user` serializer; `{ someUser: user }` does not.

## Child Loggers for Context

Attach per-request context once instead of repeating fields; reassigning `request.log` is supported:

```typescript
app.addHook("onRequest", async (request) => {
  if (request.user) {
    request.log = request.log.child({ userId: request.user.id });
  }
});
```

Service-level: `app.log.child({ service: "UserService" })`.

## Request ID / Tracing

```typescript
const app = Fastify({
  requestIdHeader: "x-request-id",
  genReqId: (request) => request.headers["x-request-id"] || crypto.randomUUID(),
});
```

Forward `request.id` as `x-request-id` on every outbound service call — that is the whole distributed-tracing story at the logging level.

To replace Fastify's default request/response log lines with your own, set `disableRequestLogging: true` and log from `onRequest` + `onResponse` (`reply.elapsedTime` for duration).

## Aggregation Metadata

Add static fields once via `base` instead of per-call: `logger: { base: { service: "user-api", version: process.env.APP_VERSION } }`. Default JSON output is what ELK/Datadog expect — do not pretty-print in production.

## Destinations and Rotation

Alternate destinations via `stream` (or `pino.multistream` for stdout + error file). Rotation belongs OUTSIDE the process (`node app.js | pino-roll --frequency daily`) — in-process rotation blocks the event loop on rollover.

## Hot Paths

Guard expensive debug payloads: `if (app.log.isLevelEnabled("debug")) request.log.debug({ details: expensiveToCompute() }, "...")` — the object argument is evaluated even when the level is disabled.
