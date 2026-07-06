---
name: cors-security
description: CORS and security headers in Fastify
metadata:
  tags: cors, security, headers, helmet, csrf
---

# CORS and Security

## CORS (@fastify/cors)

Never ship a bare `app.register(cors)` (allows all origins). Configure explicitly:

```typescript
app.register(cors, {
  origin: ["https://example.com", "https://app.example.com"],
  credentials: true,
  maxAge: 86400,
});
```

Dynamic validation uses `origin: (origin, callback)` — remember requests with **no** Origin header (curl, server-to-server, mobile) must be explicitly allowed with `callback(null, true)` or they all fail. Regex entries handle wildcard subdomains. Per-route opt-out: `config: { cors: false }` on the route.

## Security Headers (@fastify/helmet)

`app.register(helmet)` gives sane defaults. Common adjustments: CSP directives for your CDNs/APIs, `crossOriginEmbedderPolicy: false` when embedding external resources, `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`, `frameguard: { action: "deny" }`. For one-off headers, an `onSend` hook with `reply.header(...)` is enough — no plugin needed.

## Rate Limiting (@fastify/rate-limit)

**Production requires the `redis` option** — in-memory counters are per-instance and useless behind a load balancer.

```typescript
app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  redis,
  keyGenerator: (request) => request.user?.id || request.ip,
});
```

Per-route override via `config: { rateLimit: { max: 10, timeWindow: "1 minute" } }`; exempt health checks with `config: { rateLimit: false }`.

## CSRF (@fastify/csrf-protection)

Requires `@fastify/cookie` registered first. Issue tokens from a GET route via `reply.generateCsrf()`; guard mutating routes with `preHandler: app.csrfProtection`. Cookie opts: `signed: true, httpOnly: true, sameSite: "strict"`.

## Cookies

Register `@fastify/cookie` with a `secret` for signing. Session cookies: `httpOnly: true, secure: true (prod), sameSite: "strict", signed: true`. Reading a signed cookie requires `request.unsignCookie(value)` and checking `.valid` — a raw read returns the signature-suffixed string.

## Trust Proxy

Behind a load balancer, `request.ip` is the proxy's IP unless you set trust:

```typescript
const app = Fastify({ trustProxy: true }); // or ["127.0.0.1", "10.0.0.0/8"], or a hop count
```

Without it, IP-keyed rate limiting and IP allowlists key on the LB address — every client shares one bucket. HTTPS enforcement behind a proxy checks `request.headers["x-forwarded-proto"] !== "https"` in an `onRequest` hook and issues a 301 redirect.

## Input Validation as Security

Route schemas are the first security layer: constrain `maxLength`, `pattern`, `format`, and always set `additionalProperties: false` on body objects so unexpected fields are rejected rather than passed through to the database layer.

## Baseline

```typescript
const app = Fastify({ trustProxy: true, bodyLimit: 1048576 });
app.register(helmet);
app.register(cors, { origin: allowedOrigins, credentials: true });
app.register(rateLimit, { max: 100, timeWindow: "1 minute", redis });
```

Plus: schemas on every route, no internal error details in production responses, parameterized queries only.
