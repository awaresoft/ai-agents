---
name: node-js
description: Reusable Node.js/TypeScript/JavaScript engineering guidance for runtime behavior, typing discipline, tooling, testing, and production reliability.
metadata:
  short-description: Node.js and TypeScript backend implementation standards
---

# Node.js

Use this skill when implementing or reviewing JavaScript/TypeScript backend services on Node.js.

## Runtime and Tooling Baseline

- Prefer active Node.js LTS versions and lock dependency trees with a committed lockfile.
- Keep scripts deterministic across environments (local, CI, container) and fail fast on config errors.
- Be explicit about module strategy (ESM vs CJS) and avoid mixed-import edge cases.
- Externalize operational config through environment variables and validate required values at startup.

## TypeScript and JavaScript Standards

- Enable strict TypeScript settings and avoid `any` unless narrowly scoped and justified.
- Define shared contracts for DTOs, commands, queries, and events with precise domain-focused names.
- Prefer discriminated unions for state variants and result types.
- Use branded/opaque types for domain primitives (for example IDs, emails, and currency values).
- Treat type assertions as last resort; prefer safe narrowing and parser/validator-based decoding.

## Node.js Reliability Patterns

- Handle async errors explicitly; never allow unhandled promise rejections in production paths.
- Apply timeouts, retries with jitter, and cancellation (`AbortController`) for outbound I/O.
- Implement graceful shutdown (`SIGTERM`/`SIGINT`) with connection draining and in-flight request handling.
- Keep the event loop responsive: avoid CPU-heavy work on request paths; offload to workers/jobs.

## Boundary Validation and Contracts

- Validate untrusted input at system boundaries (HTTP, queue consumers, cron triggers).
- Map transport models to domain models through explicit translators to avoid leakage.
- Version external contracts (APIs/events) and preserve backward compatibility during evolution.

## Testing in Node Ecosystems

- Keep unit tests fast and isolated; mock external systems and use deterministic fixtures/builders.
- Add integration tests for persistence, messaging, and HTTP adapters against realistic dependencies.
- Verify negative paths: timeouts, retries, malformed payloads, duplicate delivery, and partial failures.
- Use fake timers carefully for time-dependent logic and reset global state between tests.

## Observability and Operability

- Emit structured logs with correlation/request IDs and avoid logging secrets or PII.
- Capture key metrics (latency, error rates, queue lag, retry counts) and expose health/readiness checks.
- Ensure startup logs include version/build metadata to support incident triage.
