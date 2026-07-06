---
name: routes
description: Route organization and handlers in Fastify
metadata:
  tags: routes, handlers, http, rest, api
---

# Route Organization and Handlers

## Non-Obvious Routing Facts

- Regex params work via find-my-way: `app.get("/orders/:id(\\d+)", ...)` matches numeric IDs only.
- Wildcard capture lands under the `"*"` key: `(request.params as { "*": string })["*"]`.
- Multiple methods on one handler: `app.route({ method: ["GET", "HEAD"], url, handler })`.
- Async handlers: `return value` serializes automatically; only call `reply.send()` for streams or callback-style handlers — never both return AND send.
- `reply.code(201)` before returning sets the status; `return reply.redirect(url)` for redirects.
- Schema defaults are APPLIED to the request: `page: { type: "integer", default: 1 }` in `querystring` means `request.query.page` is always set (and coerced to number).

## Feature-Folder Organization

House layout — one folder per domain, three files:

```
routes/users/
  index.ts       # route registrations (the plugin)
  handlers.ts    # named handler functions
  schemas.ts     # JSON schemas, incl. response schemas
```

```typescript
// routes/users/index.ts
import { createUser, getUsers } from "./handlers.js";
import { createUserSchema } from "./schemas.js";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/", getUsers);
  fastify.post("/", { schema: createUserSchema }, createUser);
}
```

Handlers type their generics inline: `FastifyRequest<{ Body: { name: string; email: string } }>`. Reach the instance from a detached handler via `request.server` (e.g. `request.server.db`).

Routes are declared RELATIVE (`"/"`, `"/:id"`); the mount point comes from `register(..., { prefix: "/users" })` or autoload's directory structure. With `@fastify/autoload`, `routes/users/_id/index.ts` maps to `/users/:id` — the `_name` folder convention is the param.

## Route Constraints

`constraints: { version: "1.0.0" }` routes by the `Accept-Version` request header — two same-URL routes can coexist per version. `constraints: { host: "api.example.com" }` does host-based dispatch. This is the built-in mechanism for API versioning without path prefixes.

## 404 and 405

`setNotFoundHandler` accepts its own hook options as a first argument (`{ preValidation, preHandler }`). Fastify has NO built-in 405 — if you need it, probe `app.hasRoute({ url, method })` for other methods inside the not-found handler and reply 405 when the path exists under a different verb.

## Route-Level config

The `config` object on a route is the extension point plugins read (`rateLimit`, custom flags). Access it in hooks via `request.routeOptions.config`:

```typescript
app.get("/slow-operation", {
  config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  handler,
});
```

`request.routeOptions.url` is the route PATTERN (`/users/:id`) — use it for metrics labels, never raw `request.url`.

## Dynamic Registration

Routes can be registered from async data (e.g. DB-driven routing) inside a plugin body — but ONLY before `app.ready()`; Fastify's router is frozen once the server starts. There is no add-route-at-runtime.
