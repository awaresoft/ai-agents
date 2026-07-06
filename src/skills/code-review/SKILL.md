---
name: code-review
description: "Use when asked to review code, a diff, a PR, or a branch, or what is wrong with a change - including pre-merge checks and post-implementation self-review."
---

# Code Review

## Workflow

1. Read the change scope and identify risk hotspots (auth, payments, data writes, public APIs).
2. Review logic paths and error handling before style or refactors.
3. Validate API contracts and backward compatibility.
4. Inspect data integrity, migrations, and transaction boundaries.
5. Check tests: coverage for edge cases, negative paths, and integrations.
6. Summarize findings ordered by severity, then list open questions.

## Severity Definitions

- **Blocker**: incorrect behavior, security issue, data loss, broken build.
- **High**: likely regression, major correctness gap, missing critical tests.
- **Medium**: edge case, performance risk, unclear behavior, maintainability risk.
- **Low**: minor cleanup, style issues, optional improvements.

## Output Format

- Findings first, ordered by severity with file references.
- Follow with open questions and assumptions.
- Provide a brief change-summary only after findings.
- If no findings, explicitly say so and list residual risks or testing gaps.

## Noise Policy

Report only findings you would defend in person. Max 3 Low-severity findings; drop the rest. One Blocker buried under 20 nitpicks is a failed review.

## Microservices Checklist

Apply ONLY if the diff touches service boundaries.

- **Service boundaries**: no cross-domain leakage; owns its data and rules.
- **Contracts**: API/event schemas versioned and backward compatible.
- **Resilience**: retries with jitter, circuit breakers, timeouts, bulkheads.
- **Data ownership**: no direct DB access across services.
- **Operational**: health checks, graceful shutdown, config via env.

## DDD Checklist

Apply ONLY if the diff touches the domain model.

- **Ubiquitous language**: names match domain terms.
- **Aggregates**: invariants enforced inside aggregate boundaries.
- **Domain events**: emitted from domain layer, not adapters.
- **Application layer**: orchestrates use cases; no domain leakage to controllers.
- **Anti-corruption**: external models mapped, not reused directly.

## Event-Driven Checklist

Apply ONLY if the diff touches message handlers.

- **Idempotency**: handlers safe to retry; dedupe strategy exists.
- **Ordering**: explicit handling for out-of-order events.
- **Delivery**: at-least-once assumed; no reliance on exactly-once.
- **Schema**: event versioning and evolution plan.
- **Failure paths**: dead-letter strategy and observability for poison events.
