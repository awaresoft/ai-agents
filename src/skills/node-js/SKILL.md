---
name: node-js
description: "Use when writing or reviewing Node.js backend or service code - async error handling, graceful shutdown, ESM/CJS interop, TypeScript strictness, or production reliability. Not for frontend code."
---

# Node.js

## House Rules

- **Branded types for IDs.** `type UserId = string & { readonly __brand: 'UserId' }` — a `UserId` can never be passed where an `OrderId` is expected. Plain `string` IDs are a standing invitation to swap arguments.
- **Discriminated unions for operation results and state variants**, not booleans-plus-nullable-fields:

  ```ts
  type SaveResult = { ok: true; id: UserId } | { ok: false; reason: 'conflict' | 'validation' };
  ```

  Callers must switch on the tag; impossible states become unrepresentable.
- **Every outbound I/O call gets an `AbortController`/timeout.** No unbounded `await` on HTTP, DB, or queue calls — a hung dependency must fail your call, not your event loop.
- **Validate `process.env` at startup against a schema and fail fast.** One typed config module; never scatter `process.env` reads through the codebase. A missing var should kill boot, not surface as `undefined` three layers deep at 2 a.m.
- **Graceful shutdown is a sequence:** stop accepting new work → drain in-flight requests → close pools/connections — under a hard deadline (then exit non-zero).
- **Unhandled rejection = crash and restart.** Do not install a swallowing handler; a process in unknown state is worse than a dead one.
- **ESM vs CJS: pick one per package and stay consistent.** Interop half-measures (`require` of ESM, dual builds without care) produce the weirdest runtime bugs in the ecosystem.
- **`tsc` passing is not runtime safety.** Types vanish at the boundary — parse external input (HTTP bodies, queue messages, third-party responses) with a runtime validator before trusting it.

For Fastify-specific patterns load the `fastify` skill.
