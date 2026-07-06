---
name: configuration
description: Application configuration in Fastify using env-schema
metadata:
  tags: configuration, environment, env, settings, env-schema
---

# Application Configuration

## House Rule: env-schema + TypeBox

**All configuration comes from environment variables, validated at boot with `env-schema`.** Invalid or missing config fails startup immediately instead of surfacing mid-request. Ship it as a named plugin so other plugins can depend on it:

```typescript
import fp from "fastify-plugin";
import envSchema from "env-schema";
import { Type, type Static } from "@sinclair/typebox";

const schema = Type.Object({
  PORT: Type.Number({ default: 3000 }),
  HOST: Type.String({ default: "0.0.0.0" }),
  DATABASE_URL: Type.String(),
  JWT_SECRET: Type.String({ minLength: 32 }),
  LOG_LEVEL: Type.String({ default: "info" }),
});

type Config = Static<typeof schema>;

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(
  async function configPlugin(fastify) {
    const config = envSchema<Config>({ schema, dotenv: true });
    fastify.decorate("config", config);
  },
  { name: "config" },
);
```

`dotenv: true` loads `.env` in development; production injects real env vars. Other plugins declare `dependencies: ["config"]` and read `fastify.config`.

## Anti-Patterns

**NEVER use configuration files** (`config/production.json`, `import('./config/${env}.js')`). They put secrets in files, create environment drift, and make rotation painful.

**NEVER branch on per-environment config objects:**

```typescript
// WRONG
const configs = { development: {...}, production: {...} };
const config = configs[process.env.NODE_ENV];
```

One configuration source (env vars) with defaults; the environment controls values, not code paths.

**Avoid `NODE_ENV` checks in application logic.** Use explicit flags instead:

```typescript
// WRONG: if (process.env.NODE_ENV === "production") ...
// RIGHT:
if (app.config.ENABLE_DETAILED_LOGGING) { ... }
```

## Secrets

Never log secrets — configure Pino redaction at boot:

```typescript
const app = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    redact: ["req.headers.authorization", "*.password", "*.secret", "*.apiKey"],
  },
});
```

Secrets arrive through env vars (fed by a secret manager in production); never commit them.

## Feature Flags

Just more validated env vars: `FEATURE_NEW_DASHBOARD: Type.Boolean({ default: false })`, read as `app.config.FEATURE_NEW_DASHBOARD` in handlers.

## Dynamic Configuration

For values that must change without restart, poll an external config service into a module-level object (`setInterval(refreshConfig, 60000)`), log refresh failures without crashing, and read the latest snapshot in hooks (e.g. a maintenance-mode `onRequest` guard that skips `/health`). Everything else stays boot-time static.
