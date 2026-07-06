---
name: error-handling
description: Error handling patterns in Fastify
metadata:
  tags: errors, exceptions, error-handler, validation
---

# Error Handling in Fastify

## Typed Errors via @fastify/error

House rule: domain errors are `@fastify/error` classes, not ad-hoc `error.statusCode = 404` mutations. `createError(code, messageTemplate, statusCode)` gives you a `code`, printf-style message, and status in one place:

```typescript
import createError from "@fastify/error";

const NotFoundError = createError("NOT_FOUND", "%s not found", 404);
const ConflictError = createError("CONFLICT", "%s already exists", 409);

app.get("/users/:id", async (request) => {
  const user = await findUser(request.params.id);
  if (!user) throw new NotFoundError("User");
  return user;
});
```

Async handler throws are caught automatically — no try/catch plumbing. Wrap external failures with context and preserve the chain: `throw new DatabaseError(error.message, { cause: error })`.

## Central Error Handler

One `setErrorHandler` at the root. Non-obvious points:

- **Validation errors carry `error.validation`** (array of Ajv issues) and `error.validationContext` (`"body" | "params" | ...`). Branch on it first. Field path is `err.instancePath.slice(1).replace(/\//g, ".")`, or `err.params?.missingProperty` for missing required fields.
- **Mask 5xx messages in production** — internal error text leaks stack/SQL details.

```typescript
app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, "Request error");

  if (error.validation) {
    return reply.code(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Validation failed",
      details: error.validation,
    });
  }

  const statusCode = error.statusCode ?? 500;
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : error.message;

  return reply.code(statusCode).send({ statusCode, error: error.code ?? "INTERNAL_ERROR", message });
});
```

`setErrorHandler` is **encapsulated**: registering one inside a plugin scopes it to that plugin's routes and overrides the root handler there. Same for `setNotFoundHandler` (customize 404s; note it accepts its own hook options).

## Hooks: throw vs reply

Errors thrown in hooks go through the same error handler. If you instead send the response directly in a hook (`reply.code(401).send(...)`), you MUST `return` afterwards — otherwise the lifecycle continues into the handler.

## Error Response Schemas

Declare error shapes in `schema.response` (`404: { $ref: "httpError#" }`) — a shared `httpError` schema added once via `app.addSchema({ $id: "httpError", ... })`. Without a response schema for the error status, the serializer falls back to full JSON.stringify; with one, error fields not in the schema are silently dropped — align the schema with what your error handler actually sends.

## @fastify/sensible

Register it for standard HTTP error helpers: `reply.notFound(msg)`, `reply.forbidden(msg)`, `reply.conflict(msg)`, etc. Prefer these over hand-built error objects for one-off HTTP errors; keep `@fastify/error` classes for reusable domain errors.

## Partial Failure

For aggregating endpoints, use `Promise.allSettled` and degrade: throw only if the required source failed, return `null` + a `warnings` array for optional sources. Don't let one optional upstream take down the whole response.
