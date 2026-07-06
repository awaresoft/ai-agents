---
name: hooks
description: Hooks and request lifecycle in Fastify
metadata:
  tags: hooks, lifecycle, middleware, onRequest, preHandler
---

# Hooks and Request Lifecycle

## Lifecycle Order

```
onRequest → preParsing → preValidation → preHandler → Handler
  → preSerialization → onSend → onResponse
```

Pick the hook by what exists at that point:

- **onRequest** — no body yet (not parsed). Auth, request ID, timing start.
- **preParsing** — receives the raw `payload` stream; return a replacement stream to transform it (e.g. `payload.pipe(zlib.createGunzip())`).
- **preValidation** — body parsed but NOT yet validated. The only place to normalize input before schema validation (`request.body.email = request.body.email?.toLowerCase().trim()`).
- **preHandler** — after validation; body is trusted. Authorization, loading related resources.
- **preSerialization** — receives the payload OBJECT; return a new object to reshape it (add `_meta`, strip fields). Runs before the response schema serializer — returned fields still get filtered by `schema.response`.
- **onSend** — payload is already a serialized STRING/buffer. Headers and payload-string tweaks only; returning a modified object here won't be re-serialized.
- **onResponse** — response already sent; cannot modify it. Logging + metrics.
- **onError** — error thrown; log/cleanup, response handled by the error handler.
- **onTimeout** / **onRequestAbort** — abort in-flight work (`request.abortController?.abort()`), delete temp files. onRequestAbort fires when the CLIENT disconnects — the only signal you get.

## Stopping the Chain

Two ways to short-circuit from a hook: `throw` (goes to the error handler), or send directly and **`return` immediately**:

```typescript
app.addHook("preHandler", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({ error: "Unauthorized" });
    return; // without this, execution continues into the handler
  }
});
```

Always write hooks as `async` — the `(request, reply, done)` callback style is legacy; mixing `async` with calling `done` causes double-continuation bugs.

## Encapsulation

`addHook` inside a plugin applies only to routes registered in that plugin (and its children); at the root it applies to everything. This is the correct way to scope auth: register an `onRequest` guard inside the `/admin` plugin instead of `if (request.url.startsWith(...))` checks in a global hook.

Same-type hooks run in registration order. Route-level hooks (`{ preHandler: [loadUser, checkQuota] }`) run AFTER the scope's hooks of the same type.

## Cross-Hook Patterns

Per-request transaction — pair three hooks; onError fires before onResponse on failure:

```typescript
app.addHook("preHandler", async (request) => {
  request.transaction = await db.beginTransaction();
});
app.addHook("onResponse", async (request) => {
  if (request.transaction) await request.transaction.commit();
});
app.addHook("onError", async (request, reply, error) => {
  if (request.transaction) await request.transaction.rollback();
});
```

For metrics/logging in onResponse, label by `request.routeOptions.url` (route pattern), not `request.url`.

## Application Lifecycle Hooks

- **onReady** — after all plugins load, before listening. Cache warmup, startup assertions. `this` is the instance when using a regular `function`.
- **onClose** — runs on `app.close()` in REVERSE registration order; close pools/queues here.
- **onRoute** — fires synchronously per route registration; use to assert route conventions (e.g. every route has a schema). Mutating `routeOptions` here is allowed.
- **onRegister** — fires per encapsulated plugin registration (NOT for `fastify-plugin`-wrapped plugins, which don't create a new context).
