---
name: authentication
description: Authentication and authorization patterns in Fastify
metadata:
  tags: auth, jwt, session, oauth, security, authorization
---

# Authentication and Authorization

## Core Pattern: Decorator + onRequest Hook

Register `@fastify/jwt`, expose an `authenticate` decorator, attach it per-route via `onRequest`. Do not verify tokens inside handlers.

```typescript
import fastifyJwt from "@fastify/jwt";

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
  sign: { expiresIn: "15m" }, // short-lived access tokens; pair with refresh rotation
});

app.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
});

app.get("/profile", { onRequest: [app.authenticate] }, async (request) => {
  return { user: request.user }; // jwtVerify() populates request.user
});
```

Gotchas:

- `request.jwtVerify()` reads the `Authorization: Bearer` header and populates `request.user` with the token payload.
- Sign with `app.jwt.sign({ id, role })` on login. Keep payloads minimal — they are readable by the client.
- Refresh tokens: rotate on every use (delete old, issue new), store server-side (Redis in production, not an in-process Map), expire after ~7 days.

## Role/Permission Guards as Decorator Factories

For parameterized guards, decorate with a function that RETURNS a hook:

```typescript
app.decorate("authorize", function (...allowedRoles: Role[]) {
  return async (request, reply) => {
    await request.jwtVerify();
    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
  };
});

app.get("/admin/users", { onRequest: [app.authorize("admin")] }, handler);
```

Same shape works for fine-grained permission checks (`checkPermission("posts", "create")`) and ownership checks (pass a `getResourceOwnerId(request)` callback; allow if owner or admin).

## API Keys

Use `@fastify/bearer-auth`. For database-backed keys pass an async `auth(key, request)` callback returning boolean; it protects every route in the encapsulation context where it is registered — scope it to a plugin, not the root, unless everything is key-protected.

## Sessions

`@fastify/cookie` + `@fastify/session` with a Redis store (`connect-redis`). Cookie options: `httpOnly: true`, `secure` in production. Guard with a `requireSession` decorator that checks `request.session.userId`. Call `request.session.destroy()` on logout.

## OAuth 2.0

`@fastify/oauth2` with `startRedirectPath` + `callbackUri`; in the callback route call `app.<name>.getAccessTokenFromAuthorizationCodeFlow(request)`, fetch the provider's userinfo endpoint, find-or-create the user, then issue your own JWT.

## Password Hashing

Use argon2 (`@node-rs/argon2`), not bcrypt: `hash(password, { memoryCost: 65536, timeCost: 3, parallelism: 4 })`. On login, return the same 401 for unknown email and wrong password.

## Rate Limiting Auth Endpoints

**In production, rate limiting MUST use a Redis backend** — in-memory `@fastify/rate-limit` state is per-instance and trivially bypassed behind a load balancer.

```typescript
app.register(
  async function authRoutes(fastify) {
    await fastify.register(fastifyRateLimit, {
      max: 5,
      timeWindow: "1 minute",
      redis,
      keyGenerator: (request) => `${request.ip}:${request.body?.email || ""}`,
    });
    fastify.post("/login", loginHandler);
    fastify.post("/forgot-password", forgotPasswordHandler);
  },
  { prefix: "/auth" },
);
```

Registering the limiter inside the plugin scopes the stricter limit to just these routes.
