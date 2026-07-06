---
name: performance
description: Performance optimization for Fastify applications
metadata:
  tags: performance, optimization, speed, benchmarking
---

# Performance Optimization

## The Two Rules That Actually Matter

1. **Response schemas on every route.** A `schema.response` entry switches serialization from `JSON.stringify` to compiled `fast-json-stringify` — typically 2-5x faster and the single biggest Fastify-specific win. No response schema = slow path.
2. **All schemas compiled at startup.** Never build/compile a schema per request; `addSchema` + `$ref` at boot. Dynamic schema construction at request time throws away Ajv/fast-json-stringify compilation caching.

## Load Shedding: @fastify/under-pressure

House rule for production services — return 503 under pressure instead of degrading everything:

```typescript
app.register(underPressure, {
  maxEventLoopDelay: 1000,
  maxHeapUsedBytes: 1000000000,
  maxRssBytes: 1500000000,
  maxEventLoopUtilization: 0.98,
  pressureHandler: (request, reply, type, value) => {
    reply.code(503).send({ error: "Service Unavailable", message: `Server under pressure: ${type}` });
  },
});
```

## CPU Work Off the Event Loop

Anything CPU-bound (image processing, crypto, big transforms) goes through `piscina` worker threads — a blocked event loop stalls every concurrent request:

```typescript
import Piscina from "piscina";

const piscina = new Piscina({ filename: join(import.meta.dirname, "workers", "compute.js") });

app.post("/compute", async (request) => piscina.run(request.body));
```

## Stream Large Payloads

Return a stream from the handler (`reply.send(createReadStream(path))` with `reply.type(...)` set) instead of buffering files into memory. For large DB exports, write incrementally to `reply.raw` (`write("[")`, comma-join chunks, `end()`), iterating a cursor rather than `toArray()`.

## Caching and Request Coalescing

House choice: `async-cache-dedupe` — unlike a plain LRU it also DEDUPLICATES concurrent identical calls (one DB hit for N simultaneous requests) and supports stale-while-revalidate:

```typescript
import { createCache } from "async-cache-dedupe";

const cache = createCache({ ttl: 60, stale: 5, storage: { type: "memory" } });
cache.define("fetchData", async (id: string) => db.findById(id));

app.get("/data/:id", async (request) => cache.fetchData(request.params.id));
```

Multi-instance: switch storage to `{ type: "redis", options: { client: redis } }`. Also set `Cache-Control` headers on genuinely static responses — the cheapest cache is the client's.

## Instance Options Checklist

- `bodyLimit` global + generous per-route only where needed (uploads).
- `@fastify/compress` with `threshold: 1024`; skip for already-compressed content.
- `connectionTimeout` / `keepAliveTimeout` set explicitly (keep-alive must exceed LB idle timeout).
- `disableRequestLogging: true` if you emit your own access logs; `caseSensitive: true` (default) is slightly faster — don't disable it for cosmetics.
- Don't log large objects on hot paths — log IDs, not payloads; the log-call object argument is built even if the level is off.

## Measure, Don't Guess

- Load test with `autocannon -c 100 -d 30 -p 10 http://localhost:3000/api/users`.
- Flame graphs with `npx @platformatic/flame app.js`.
- Watch for closure leaks: decorating requests with functions that capture large loaded objects pins them for the request's lifetime — load on demand inside the function instead.
