---
name: typescript
description: TypeScript integration with Fastify
metadata:
  tags: typescript, types, generics, type-safety
---

# TypeScript Integration

## House Rules

- Run TS directly via Node type stripping (22.6+ `--experimental-strip-types`, plain `node app.ts` on 23+). tsconfig for this mode: `"module": "NodeNext"`, `"verbatimModuleSyntax": true`, `"erasableSyntaxOnly": true`, `"noEmit": true`, `"strict": true`. Type-check separately (`tsc --noEmit` in CI/test script) — the runtime never type-checks.
- Prefer the TypeBox type provider over hand-written generics; hand generics duplicate the schema and drift.

## Type Provider (Preferred)

```typescript
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const app = Fastify().withTypeProvider<TypeBoxTypeProvider>();

app.post(
  "/users",
  {
    schema: {
      body: Type.Object({ name: Type.String({ minLength: 1 }), email: Type.String({ format: "email" }) }),
      response: { 201: UserSchema },
    },
  },
  async (request, reply) => {
    const { name, email } = request.body; // inferred from schema — no generics
    reply.code(201);
    return { id: "generated", name, email };
  },
);
```

Gotcha: `withTypeProvider` returns a NEW typed instance — routes registered on the original `app` reference don't get inference. In plugins, the incoming instance must also be provider-typed (or re-`withTypeProvider` it).

## Manual Route Generics (When Not Schema-Driven)

`app.get<{ Params: { id: string }; Querystring: { include?: string }; Body: CreateUserBody; Reply: User }>(...)`. Note the keys: `Querystring` (not `Query`), `Reply` types the RETURN value. Keep them as simple named interfaces; no mapped-type gymnastics.

## Decorator Typing: Declaration Merging

Every decorator needs a matching `declare module "fastify"` augmentation, or every access site casts:

```typescript
declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
  interface FastifyRequest {
    user?: { id: string; email: string; role: string };
  }
  interface FastifyReply {
    sendSuccess: (data: unknown) => void;
  }
}
```

Put the augmentation in the plugin file that adds the decorator — one source of truth. Reply decorators using `this` must be regular `function`s, not arrows.

## Plugin Typing

Type options via `FastifyPluginAsync<Options>`:

```typescript
const databasePlugin: FastifyPluginAsync<DatabasePluginOptions> = async (fastify, options) => {
  const { connectionString, poolSize = 10 } = options;
  fastify.decorate("db", await createConnection(connectionString, poolSize));
};

export default fp(databasePlugin, { name: "database" });
```

## Hook Typing

Standalone hook functions use the exported handler types — `onRequestHookHandler`, `preHandlerHookHandler`, etc. — so they can be defined away from `addHook` without `any`.

## Plain JSON Schema + Types

If a schema must stay plain JSON Schema, declare it `as const satisfies JSONSchema7` (from `json-schema`) and keep a hand-written type next to it — do NOT build `InferSchemaType<...>` conditional-type machinery. Simple visible duplication beats clever inference that breaks on every TS upgrade.
