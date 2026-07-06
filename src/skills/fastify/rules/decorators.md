---
name: decorators
description: Decorators and request/reply extensions in Fastify
metadata:
  tags: decorators, extensions, customization, utilities
---

# Decorators and Extensions

Three targets: `decorate` (instance), `decorateRequest`, `decorateReply`. Reply/request decorator methods use `function` (not arrow) so `this` binds to the reply/request. Handlers using `function` syntax get the instance as `this`.

## Gotcha: Reference vs Value Semantics

`decorateRequest` with an OBJECT default shares that one object across ALL requests — a mutation in one request leaks into every other. Decorate with `null` (or a primitive, which is copied per-request) and initialize per-request in a hook:

```typescript
app.decorateRequest("ctx", null);

app.addHook("onRequest", async (request) => {
  request.ctx = {
    traceId: request.headers["x-trace-id"]?.toString() || crypto.randomUUID(),
    user: null,
    startTime: Date.now(),
  };
});
```

This hook-initialized request-context object is the canonical way to carry per-request state (auth user, permissions, trace id) between hooks and the handler.

## TypeScript Declaration Merging

Every decorator needs a matching `declare module "fastify"` block or it types as `any`/error:

```typescript
declare module "fastify" {
  interface FastifyInstance {
    db: DatabaseClient;
  }
  interface FastifyRequest {
    ctx: RequestContext;
  }
  interface FastifyReply {
    sendError: (code: number, message: string) => void;
  }
}
```

Note the type is the initialized shape (`RequestContext`), even though the decorator default is `null` — the hook guarantees initialization before handlers run.

## Encapsulation

Decorators are scoped to the plugin that registers them and its children — siblings and the parent do NOT see them:

```typescript
app.register(async function pluginA(fastify) {
  fastify.decorate("pluginAUtil", () => "A"); // visible here + children only
});

app.register(async function pluginB(fastify) {
  // this.pluginAUtil is undefined here
});
```

To share upward/sideways (the normal case for db clients, services), wrap the plugin in `fastify-plugin` (`fp(...)`). Guard cross-plugin assumptions with `hasDecorator("db")` / `hasRequestDecorator(...)` / `hasReplyDecorator(...)` at registration time, or better, declare `dependencies: ["database-plugin"]` in the fp metadata so load order is enforced.

## Dependency Injection Pattern

Decorators are Fastify's DI container: a `database` fp-plugin decorates `db` and registers an `onClose` hook to dispose it; a `userService` fp-plugin declares `dependencies: ["database-plugin"]` and decorates a service object built on `fastify.db`. Async setup is safe — plugin registration awaits before any route executes, so `await createConnection()` inside the plugin body needs no readiness flags.

## Reply Helpers

Decorate replies once for consistent response envelopes instead of repeating `code().send()` shapes:

```typescript
app.decorateReply("notFound", function (resource = "Resource") {
  this.code(404).send({ statusCode: 404, error: "Not Found", message: `${resource} not found` });
});

// handler: if (!user) return reply.notFound("User");
```

Same pattern for `ok`/`created`/`badRequest`/etc. Instance decorators can also be factories returning functions (e.g. `app.createValidator(schema)` compiling an Ajv validator once and reusing it).
