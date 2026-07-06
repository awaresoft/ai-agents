---
name: testing
description: Testing Fastify applications with inject()
metadata:
  tags: testing, inject, node-test, integration, unit
---

# Testing Fastify Applications

## House Stack: node:test + inject()

Tests use `node:test` (with `t.assert`) and Fastify's `inject()` — a simulated HTTP request with no socket, no port, no supertest. Lifecycle rules:

- `await app.ready()` in `before` — inject() before ready is the classic silent-hang mistake (inject does wait, but plugin boot errors surface here, not per-test).
- `await app.close()` in `after` — leaked instances keep pools open and hang the runner.
- Build the app via an exported `buildApp()` factory that does NOT call `listen()`; production entry calls `listen`, tests never do.

```typescript
import { describe, it, before, after } from "node:test";
import { buildApp } from "./app.js";

describe("User API", () => {
  let app;

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it("should create a user", async (t) => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "John Doe", email: "john@example.com" },
    });

    t.assert.equal(response.statusCode, 201);
    t.assert.ok(response.json().id);
  });
});
```

## inject() Surface Worth Knowing

- `payload` — object is JSON-encoded with the right content-type automatically; a `form-data` instance works for multipart (pass `headers: form.getHeaders()`).
- `query: { page: "1" }` or inline `url: "/users?q=john"` — both fine.
- `headers: { authorization: \`Bearer ${token}\` }` for auth; obtain the token by injecting the login route in `before`, not by forging JWTs unless testing the verifier itself.
- Response: `response.json()` parses; `response.rawPayload` is the Buffer (use for streams/binary); `response.headers` for header assertions.
- Content-type asserts against the FULL value: `"application/json; charset=utf-8"`.

## Test Behaviors That Only Exist in Fastify

- Validation: inject invalid payloads and assert 400 + message content — schemas are behavior, they need tests.
- Coercion: assert `?limit=10&active=true` reaches the handler as number/boolean.
- Hooks: assert their observable effects (e.g. `x-request-id` header present). To assert logging, pass a capture stream: `logger: { stream: { write: (msg) => logs.push(JSON.parse(msg)) } }`.
- Plugins in isolation: bare `Fastify()` + `register(plugin)` + `await app.ready()`, then `app.hasDecorator("cache")` and direct decorator calls — no HTTP needed.

## Mocking

Prefer composition over module mocking: build a bare instance, `app.decorate("db", mockDb)` (with `node:test`'s `mock.fn`), then register only the routes under test. Assert calls via `app.db.users.findAll.mock.calls.length`.

## Isolation

- Tests default `logger: false`.
- DB integration tests: `BEGIN` in `beforeEach`, `ROLLBACK` in `afterEach`.
- node:test runs files in parallel — each `describe` file builds its OWN app instance; never share a module-level instance across files.

## Running

```bash
node --test                                   # all
node --test --experimental-test-coverage      # coverage
node --test --watch                           # watch
```
