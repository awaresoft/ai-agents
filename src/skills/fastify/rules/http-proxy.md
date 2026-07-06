---
name: http-proxy
description: HTTP proxying and reply.from() in Fastify
metadata:
  tags: proxy, gateway, reverse-proxy, microservices
---

# HTTP Proxy and Reply.from()

## Choosing the Tool

- `@fastify/http-proxy` — whole-prefix reverse proxy (it wraps reply-from). Supports `rewritePrefix`, a `preHandler` for auth-before-proxy, and `websocket: true` for WS pass-through.
- `@fastify/reply-from` — per-route control via `reply.from()`: header rewriting, conditional upstreams, response manipulation.

```typescript
app.register(httpProxy, {
  upstream: "http://backend-service:3001",
  prefix: "/api",
  rewritePrefix: "/v1",
  preHandler: async (request, reply) => {
    if (!request.headers.authorization) reply.code(401).send({ error: "Unauthorized" });
  },
});
```

## reply.from() Canonical Pattern

```typescript
app.register(replyFrom, { base: "http://backend-service:3001" });

app.get("/users/:id", async (request, reply) => {
  return reply.from(`/api/users/${request.params.id}`, {
    rewriteRequestHeaders: (originalReq, headers) => ({
      ...headers,
      "x-request-id": request.id,
      "x-forwarded-for": request.ip,
    }),
    onResponse: (request, reply, res) => {
      reply.header("x-proxy", "fastify");
      reply.send(res); // you MUST send res yourself when onResponse is defined
    },
  });
});
```

`reply.from()` also accepts a per-call `base`, which is how you do conditional upstream routing (canary by header, tenant sharding) from a single `app.all("/api/*")` route.

## Body Handling Gotcha

By default the parsed `request.body` is re-serialized and forwarded. For uploads/large payloads, bypass parsing and stream the raw request instead:

```typescript
app.post("/upload", async (request, reply) => {
  return reply.from("/upload", {
    body: request.raw,
    contentType: request.headers["content-type"],
  });
});
```

Note: for a pass-through proxy prefix, you typically also want a catch-all content-type parser that returns the stream untouched, so Fastify doesn't buffer/parse bodies it will only forward.

## API Gateway Pattern

One encapsulated plugin per upstream, each with its own `prefix`; inside, an `app.all("/*")` route strips the prefix and calls `reply.from(url, { base: services.users })`. Per-upstream auth/rate-limit hooks then scope naturally to their plugin.

## Upstream Errors and Timeouts

Map upstream failures to 502/503 explicitly — otherwise clients see raw socket errors:

```typescript
app.register(replyFrom, {
  base: "http://backend:3001",
  onError: (reply, error) => {
    reply.log.error({ err: error }, "Proxy error");
    reply.code(502).send({ error: "Bad Gateway", message: "Upstream service unavailable" });
  },
  http: { requestOptions: { timeout: 30000 } },
});
```

Set the timeout deliberately; the proxy's timeout must be shorter than your own `requestTimeout` or clients hit the generic timeout first.

## Caching Proxied GETs

Use `async-cache-dedupe` (`createCache({ ttl: 60 })` + `cache.define("proxyGet", fetcher)`) in front of the upstream — it also deduplicates concurrent identical requests, which a plain TTL map does not.
