---
name: content-type
description: Content type parsing in Fastify
metadata:
  tags: content-type, parsing, body, multipart, json
---

# Content Type Parsing

Built-in parsers cover only `application/json` and `text/plain`. Anything else (form-urlencoded, XML, protobuf) needs `@fastify/formbody` or a custom parser — otherwise Fastify replies 415.

## Custom Parsers

```typescript
app.addContentTypeParser(
  "application/x-www-form-urlencoded",
  { parseAs: "string" },
  async (request, body) => Object.fromEntries(new URLSearchParams(body)),
);
```

- `parseAs: "string" | "buffer"` buffers the payload for you; omit it to receive the raw stream (return the stream directly for pass-through handling of e.g. `application/octet-stream`).
- Async parsers return the parsed body; callback style uses `done(null, parsed)`.
- A regex matcher handles suffix types: `app.addContentTypeParser(/^application\/.*\+json$/, ...)`.
- `"*"` registers a catch-all for unknown content types.
- To replace the JSON parser, `removeContentTypeParser("application/json")` first, then add your own (throw `{ statusCode: 400, code: "INVALID_JSON", ... }` on parse failure).
- Parsing does not validate — route `schema.body` still runs after the parser.

## Multipart Uploads (@fastify/multipart)

Two gotchas that bite in production:

1. **Without explicit `limits` you accept unbounded uploads.**
2. **The default on exceeding `fileSize` is to TRUNCATE the file silently** — set `throwFileSizeLimit: true`.

```typescript
app.register(fastifyMultipart, {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    fields: 10,
    fileSize: 10 * 1024 * 1024,
    files: 5,
    parts: 1000,
  },
  throwFileSizeLimit: true,
  attachFieldsToBody: true,
});

app.post("/upload", async (request, reply) => {
  const data = await request.file();
  if (!data) return reply.code(400).send({ error: "No file uploaded" });
  const buffer = await data.toBuffer(); // data.file is the underlying stream
  return { filename: data.filename, mimetype: data.mimetype, size: buffer.length };
});
```

- Multiple files: `for await (const part of request.files())`.
- Mixed fields + files: `for await (const part of request.parts())`, branch on `part.type === "file"`; field values are `part.value`.
- Validate `part.mimetype` against an allowlist — never trust the client's declared type for security decisions.

## Body Limits

Three levels, most specific wins:

```typescript
const app = Fastify({ bodyLimit: 1048576 }); // global 1MB

app.post("/large-upload", { bodyLimit: 52428800 }, handler); // per-route

app.addContentTypeParser("application/json", { parseAs: "string", bodyLimit: 2097152 }, parser); // per-parser
```

## Content Negotiation

Request parsing is chosen by `Content-Type`; response format is your job — branch on `request.headers.accept` and set `reply.type(...)` before returning.
