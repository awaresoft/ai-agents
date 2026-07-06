---
name: deployment
description: Production deployment for Fastify applications
metadata:
  tags: deployment, production, docker, kubernetes, scaling
---

# Production Deployment

## Graceful Shutdown: close-with-grace

House rule: shutdown goes through `close-with-grace`, not hand-rolled `process.on("SIGTERM")`. It handles signals AND uncaught errors, and enforces a hard deadline if `app.close()` hangs. `app.close()` runs `onClose` hooks in reverse registration order — plugins (DB pools, queues) clean up automatically.

```typescript
import closeWithGrace from "close-with-grace";

closeWithGrace({ delay: 10000 }, async ({ signal, err }) => {
  if (err) app.log.error({ err }, "Server closing due to error");
  else app.log.info({ signal }, "Server closing due to signal");
  await app.close();
});

await app.listen({ port: app.config.PORT, host: "0.0.0.0" });
```

`host: "0.0.0.0"` is mandatory in containers — the default `localhost` is unreachable from outside the container.

## Health Checks: liveness vs readiness

Split them. `/health/live` returns `{ status: "ok" }` unconditionally (process is up — a failing liveness probe causes restarts, so never tie it to dependencies). `/health/ready` checks dependencies and returns **503** when any is down, so the orchestrator stops routing traffic without restarting the pod:

```typescript
app.get("/health/ready", async (request, reply) => {
  const checks = { database: await app.checkDatabaseHealth() };
  const allHealthy = Object.values(checks).every(Boolean);
  if (!allHealthy) reply.code(503);
  return { status: allHealthy ? "ok" : "degraded", checks };
});
```

Exempt health routes from rate limiting and auth. A detailed `/health/details` (memory, uptime, version) should sit behind admin auth.

## Kubernetes Gotchas

- `preStop: exec: command: ["/bin/sh", "-c", "sleep 5"]` — gives the endpoint-removal a head start so in-flight routing drains before SIGTERM.
- Liveness probe → `/health/live`, readiness probe → `/health/ready`. Pointing liveness at the dependency-checking route causes restart storms during a DB outage.
- Docker: run as a non-root user, multi-stage build with `npm ci --only=production`, and a `HEALTHCHECK` hitting `/health`.

## Timeouts and Proxy Trust

```typescript
const app = Fastify({
  connectionTimeout: 30000,
  keepAliveTimeout: 72000, // MUST exceed the LB idle timeout (ALB 60s) or you get random 502s
  requestTimeout: 30000,
  bodyLimit: 1048576,
  trustProxy: true, // else request.ip is the LB address
});
```

The `keepAliveTimeout > LB idle timeout` rule is the classic source of intermittent 502s behind ALBs.

## Logging, Compression, Static

- Production logger: JSON to stdout, `redact` on `req.headers.authorization`, `req.headers.cookie`, `*.password`, `*.token`, `*.secret`. Never pretty-print in production.
- `@fastify/compress` with `threshold: 1024` — compressing tiny payloads wastes CPU.
- `@fastify/static`: root from `join(import.meta.dirname, "..", "public")` — **never `process.cwd()`** (breaks when the process starts from a different directory).

## Prometheus Metrics

Record in an `onResponse` hook; label by `request.routeOptions.url` (the route PATTERN, e.g. `/users/:id`), never `request.url` — raw URLs explode label cardinality:

```typescript
app.addHook("onResponse", (request, reply, done) => {
  const labels = {
    method: request.method,
    route: request.routeOptions.url || request.url,
    status: reply.statusCode,
  };
  httpRequestDuration.observe(labels, reply.elapsedTime / 1000);
  done();
});
```

`reply.elapsedTime` is milliseconds — divide by 1000 for seconds-based histograms.
