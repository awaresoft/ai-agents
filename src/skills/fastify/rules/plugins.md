---
name: plugins
description: Plugin development and encapsulation in Fastify
metadata:
  tags: plugins, encapsulation, modules, architecture
---

# Plugin Development and Encapsulation

## The Encapsulation Rule

`register()` creates a NEW context: decorators, hooks, and parsers added inside a plugin are visible to that plugin and its children, never to the parent or siblings. This is the core architectural tool, not an obstacle:

- **Infrastructure plugins** (db, auth, config) that must be visible upward: wrap in `fastify-plugin` (`fp(...)`) — it skips the child-context creation.
- **Route groups**: plain async function plugins keep scoping — an auth hook registered inside `protectedRoutes` guards only those routes.

```typescript
import fp from "fastify-plugin";

export default fp(
  async function databasePlugin(fastify, options) {
    const db = await createConnection(options.connectionString);
    fastify.decorate("db", db);
    fastify.addHook("onClose", async () => {
      await db.close();
    });
  },
  { name: "database-plugin", dependencies: ["config"] },
);
```

Rule of thumb: if the file decorates the instance for others, use `fp()`; if it registers routes, don't.

## Loading Semantics — the Part Everyone Gets Wrong

`register()` does NOT execute the plugin immediately; loading happens at `await app.ready()` (or `listen`). Consequences:

- You cannot read a sibling plugin's decorator in the registering scope right after `register()`.
- Sequencing between plugins: prefer declared `dependencies: ["database-plugin"]` in `fp()` metadata (boot fails loudly if missing/misordered) over `.after()` callback chains. Guard hard requirements with `if (!fastify.hasDecorator("db")) throw`.
- Inside a plugin, `await fastify.register(child)` DOES complete the child before the next line — use it when the plugin's own code needs the child's decorators.

## Plugin Conventions

- Always set `name` in `fp()` metadata; `dependencies` and `fastify: "5.x"` version pinning catch wiring mistakes at boot.
- Validate options at registration and throw — a plugin that boots with bad config fails at request time instead.
- Named plugin functions (`async function databasePlugin(...)`) — anonymous functions produce useless boot-error traces.
- Factory pattern for reusable configurable plugins: a function returning `fp(...)` with defaults merged over per-registration options.

## Route Prefixing

`app.register(import("./routes/users.js"), { prefix: "/api/v1/users" })` — inside the plugin, routes are declared relative (`"/"`, `"/:id"`). Prefixes nest across plugin levels. Never hardcode the full path inside route files; the mount point belongs to the composition root.

## Autoload

`@fastify/autoload` loads every plugin/route file in a directory:

```typescript
app.register(autoload, { dir: join(__dirname, "plugins") });
app.register(autoload, { dir: join(__dirname, "routes"), options: { prefix: "/api" } });
```

Convention: `plugins/` for fp-wrapped shared infrastructure, `routes/` for encapsulated route plugins. Autoload respects each file's own `fp()` wrapping.

## Testing Plugins in Isolation

Register the plugin on a bare Fastify instance, `await app.ready()`, assert with `app.hasDecorator(...)`; `await app.close()` in teardown:

```typescript
before(async () => {
  app = Fastify();
  app.register(myPlugin, { option: "value" });
  await app.ready();
});

it("should decorate fastify instance", (t) => {
  t.assert.ok(app.hasDecorator("myDecorator"));
});
```
