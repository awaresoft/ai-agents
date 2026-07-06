---
name: serialization
description: Response serialization in Fastify with TypeBox
metadata:
  tags: serialization, response, json, fast-json-stringify, typebox
---

# Response Serialization

## The Fast Path

A `schema.response[status]` entry switches the route from `JSON.stringify` to compiled `fast-json-stringify` (2-3x faster) AND turns the schema into an output filter. House rule: TypeBox response schemas on every production route, typed via the route generic:

```typescript
const UserResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
});

app.get<{ Reply: Static<typeof UserResponse> }>(
  "/users/:id",
  { schema: { response: { 200: UserResponse, 404: ErrorResponse } } },
  handler,
);
```

Status keys can be exact (`200`, `404`) or ranges (`"4xx"`, `"5xx"`) — use ranges for shared error shapes.

## Filtering Semantics — Read This Twice

fast-json-stringify serializes ONLY schema-declared properties:

- Security win: a returned entity's `password` field is stripped automatically.
- Classic bug: "my new field is missing from the response" — you added it to the entity but not the response schema. The serializer drops it silently, no warning.
- `additionalProperties: false` is the default behavior for output; set `additionalProperties: true` on a schema object if you genuinely need pass-through — but then that subtree loses the fast path's guarantees.

## Coercion on Output

The serializer coerces to schema types: `"5"` → `5` for `type: "integer"`, `[1, 2]` → `["1", "2"]` for string arrays. Don't rely on it as a feature — it masks type bugs upstream — but know it explains "why is this a string now".

Type mapping rules:

- **Dates:** schema `{ type: "string", format: "date-time" }` + convert with `.toISOString()` in the handler.
- **BigInt:** not JSON-serializable — `.toString()` into a string-typed field (or `Number()` only when provably within safe range).
- **Nullable:** `type: ["string", "null"]` — a plain `type: "string"` field receiving `null` serializes as `"null"`/empty depending on version; always declare null explicitly.

## Streams Bypass Serialization

Returning/sending a stream skips the serializer entirely: `reply.type("application/json"); return reply.send(stream)`. For streaming a large JSON array from a cursor, write to `reply.raw` manually (`write("[")` / comma-join / `end()`) — once you touch `reply.raw`, Fastify's serialization, onSend payload replacement, and content-length handling are all on you.

## Reshaping vs Rewriting

- `preSerialization` hook — receives the payload OBJECT; return a modified object (e.g. add `_links`). Output still passes through the response schema filter afterwards.
- `onSend` hook — payload is already a serialized string; header tweaks and string-level edits only.

## Custom Serializers

- Per-route: `serializerCompiler: ({ schema }) => (data) => string` in the route options.
- Global: `serializerCompiler` on the Fastify instance (receives `{ schema, method, url, httpStatus }`).
- One-off passthrough of a pre-serialized string: `reply.serializer((payload) => payload)` then return the string with `reply.type(...)` set — otherwise your JSON string gets double-encoded.
