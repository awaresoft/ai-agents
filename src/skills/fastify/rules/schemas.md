---
name: schemas
description: JSON Schema validation in Fastify with TypeBox
metadata:
  tags: validation, json-schema, schemas, ajv, typebox
---

# JSON Schema Validation

## House Rule: TypeBox

Define schemas with TypeBox — one definition yields both the JSON Schema (validated by Ajv, serialized by fast-json-stringify) and the TypeScript type via `Static<typeof X>`. Plain JSON Schema is acceptable for shared/legacy schemas, never hand-duplicated interfaces.

```typescript
import { Type, type Static } from "@sinclair/typebox";

const CreateUserBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: "email" }),
  age: Type.Optional(Type.Integer({ minimum: 0 })),
});
type CreateUserBodyType = Static<typeof CreateUserBody>;

app.post<{ Body: CreateUserBodyType }>(
  "/users",
  { schema: { body: CreateUserBody, response: { 201: UserResponse } } },
  async (request, reply) => {
    const user = await createUser(request.body); // fully typed
    reply.code(201);
    return user;
  },
);
```

Validate every request part the route uses: `body`, `querystring`, `params`, `headers`. Set `additionalProperties: false` on body objects — unknown fields should be rejected, not forwarded.

## Shared Schemas: $id + $ref

Register cross-route schemas once with `app.addSchema({ $id: "user", ... })`, reference as `{ $ref: "user#" }` — note the trailing `#`. Gotchas:

- `addSchema` is encapsulated like everything else: add shared schemas at the ROOT (or in an `fp()` plugin) or child plugins can't resolve the `$ref`.
- All `addSchema` calls must happen before the routes referencing them are registered.
- For TypeBox, spread the `$id` in: `app.addSchema(Type.Object({ $id: "ErrorResponse", ...ErrorResponse }))`.
- Keep a `schemas/index.ts` exporting an array; loop `app.addSchema` at boot.

## Coercion and Defaults — Behavior, Not Just Validation

Fastify's Ajv defaults mutate the request: querystring/params `"5"` → `5` for `type: "integer"`, `"true"` → `true` for boolean, and `default:` values are FILLED IN (`{ page: { type: "integer", default: 1 } }` guarantees `request.query.page` exists). A schema is therefore also your parsing layer — don't re-parse in handlers.

Global Ajv options when needed:

```typescript
const app = Fastify({
  ajv: {
    customOptions: { removeAdditional: "all", useDefaults: true, coerceTypes: true, allErrors: true },
    plugins: [require("ajv-formats")],
  },
});
```

Custom formats go in `ajv.customOptions.formats` (`"iso-country": /^[A-Z]{2}$/`); custom keywords in `customOptions.keywords`. Both must be configured at instance creation — Ajv is compiled at boot.

## Validation Failures

Failed validation throws before the handler; the error carries `error.validation` (Ajv issue array). Shape the 400 response in `setErrorHandler` — field is `err.instancePath || err.params?.missingProperty`.

## Nullable and Conditional

- Nullable: `type: ["string", "null"]` (or TypeBox `Type.Union([Type.String(), Type.Null()])`) — NOT OpenAPI's `nullable: true`, which Ajv ignores by default.
- Conditional requirements: JSON Schema `if/then/else` works (`if method=card then require cardNumber`).

## Response Schemas Are Mandatory

`schema.response[status]` does two things: enables fast-json-stringify (major perf win) and acts as an output filter — properties absent from the schema are silently dropped (accidental-leak protection, but also a classic "why is my field missing" bug). Define one per status code you emit, including error statuses.

`@fastify/swagger` + `@fastify/swagger-ui` generate OpenAPI directly from these same route schemas — no separate spec file.
