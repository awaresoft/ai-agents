---
name: database
description: Database integration with Fastify using official adapters
metadata:
  tags: database, postgres, mysql, mongodb, redis, sql
---

# Database Integration

## House Rule: Official @fastify Adapters

Use the official plugins (`@fastify/postgres`, `@fastify/mysql`, `@fastify/mongodb`, `@fastify/redis`). They wire pooling into Fastify's lifecycle — connections close on `app.close()`, which hand-rolled clients routinely forget.

## PostgreSQL Canonical Pattern

```typescript
app.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Simple queries: pool directly
app.get("/users/:id", async (request) => {
  const { rows } = await app.pg.query("SELECT * FROM users WHERE id = $1", [request.params.id]);
  return rows[0];
});

// Transactions: dedicated client, release in finally
app.post("/transfer", async (request) => {
  const client = await app.pg.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, fromId]);
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, toId]);
    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release(); // missing this leaks the pool one request at a time
  }
});
```

Gotcha: `app.pg.connect()` checks a client OUT of the pool — every code path must `release()` it, including throws. Use the pool (`app.pg.query`) unless you need a transaction. Same discipline for `@fastify/mysql` (`promise: true`, `getConnection()`/`release()`).

Other adapters: `@fastify/mongodb` exposes `app.mongo.db` and `app.mongo.ObjectId`; `@fastify/redis` exposes `app.redis` (ioredis API) — the standard cache-aside pattern is `get` → miss → fetch → `setex`.

## Database as a Named Plugin

Wrap registration in `fastify-plugin` so `app.pg` escapes encapsulation, and declare dependencies so config loads first:

```typescript
export default fp(
  async function databasePlugin(fastify) {
    await fastify.register(fastifyPostgres, { connectionString: fastify.config.DATABASE_URL });
    fastify.decorate("checkDatabaseHealth", async () => {
      try { await fastify.pg.query("SELECT 1"); return true; } catch { return false; }
    });
  },
  { name: "database", dependencies: ["config"] },
);
```

## Repository Pattern

Keep SQL out of handlers: a factory `createUserRepository(app)` returning `findById`/`create`/`update`/`delete` methods, registered as a `repositories` decorator in a plugin with `dependencies: ["database"]`. Handlers call `app.repositories.users.findById(id)`. Always parameterized queries (`$1`), never string interpolation.

## Test Isolation via Transactions

Wrap each test in a transaction and roll it back — no fixture cleanup:

```typescript
beforeEach(async () => {
  client = await app.pg.connect();
  await client.query("BEGIN");
});

afterEach(async () => {
  await client.query("ROLLBACK");
  client.release();
});
```
