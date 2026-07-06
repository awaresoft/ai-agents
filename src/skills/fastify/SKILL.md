---
name: fastify
description: "Use when writing or reviewing Fastify code - plugins, routes, hooks, decorators, JSON Schema or TypeBox validation, inject() testing, Pino logging, or Fastify TypeScript typing."
---

# Fastify

The `node-js` skill applies underneath — this file adds Fastify house rules and routes to detailed topic files.

## House Rules

- **TypeBox over raw JSON Schema** for all route schemas — one source for validation, serialization, and static types.
- **Schema on EVERY route, including `response` serialization schemas.** Response schemas are both the contract and a major perf win (fast-json-stringify); omitting them is not neutral.
- **Tests use `fastify.inject()` + `node:test`.** No supertest, no listening on real ports.
- **Plugins are encapsulated by default.** Wrap with `fastify-plugin` ONLY when a plugin must share decorators/hooks with siblings — reaching for `fp()` everywhere destroys encapsulation, Fastify's core feature.
- **Log via `request.log`** (the per-request child logger with req-id), never `console.*`.
- **Register order matters:** plugins → decorators → hooks → routes, in that order within a scope.
- **Async handlers return values.** Never mix callback style (`reply.send` + done) with async/return in one handler.

## Topic Files

Read a rule file ONLY when the task touches its topic; never load more than 2-3 per task.

- [rules/plugins.md](rules/plugins.md) - Plugin development and encapsulation
- [rules/routes.md](rules/routes.md) - Route organization and handlers
- [rules/schemas.md](rules/schemas.md) - JSON Schema validation
- [rules/error-handling.md](rules/error-handling.md) - Error handling patterns
- [rules/hooks.md](rules/hooks.md) - Hooks and request lifecycle
- [rules/authentication.md](rules/authentication.md) - Authentication and authorization
- [rules/testing.md](rules/testing.md) - Testing with inject()
- [rules/performance.md](rules/performance.md) - Performance optimization
- [rules/logging.md](rules/logging.md) - Logging with Pino
- [rules/typescript.md](rules/typescript.md) - TypeScript integration
- [rules/decorators.md](rules/decorators.md) - Decorators and extensions
- [rules/content-type.md](rules/content-type.md) - Content type parsing
- [rules/serialization.md](rules/serialization.md) - Response serialization
- [rules/cors-security.md](rules/cors-security.md) - CORS and security headers
- [rules/websockets.md](rules/websockets.md) - WebSocket support
- [rules/database.md](rules/database.md) - Database integration patterns
- [rules/configuration.md](rules/configuration.md) - Application configuration
- [rules/deployment.md](rules/deployment.md) - Production deployment
- [rules/http-proxy.md](rules/http-proxy.md) - HTTP proxying and reply.from()
