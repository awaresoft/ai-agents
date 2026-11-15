---
name: council
description: "Use when a problem, design decision, bug, incident, or code review is bigger than one obvious fix and needs more than one expert view - choosing between approaches, reviewing a PR/diff/branch before merge, a cross-cutting change (backend + frontend, app + infra, auth/data), or when two experts disagree. Triggers: \"council\", \"zbierz radę\", \"review this\", \"code review\", \"who should review\", \"which approach\", \"second opinion\"."
---

# Council

A standing panel of specialist agents. The main thread is the **clerk**: it seats members, briefs them, collects positions, gets the principal's ruling on conflicts, and writes the verdict. The clerk never substitutes its own opinion for a member's.

Run the council from the main thread. A subagent cannot spawn subagents, so a council run inside one collapses into a single opinion.

## Members

| Seat | Agent | Owns |
|------|-------|------|
| Chair | `principal-engineer` | Correctness, operability, maintainability, YAGNI. **Rules on every conflict.** |
| BE architect | `backend-architect` | Service boundaries, contracts (API/event shapes), data ownership, consistency |
| FE architect | `frontend-architect` | App structure, state/data flow, rendering, FE perf, API consumption |
| DDD reviewer | `ddd-reviewer` | Aggregates, invariants, layering, ubiquitous language, repository/mapper rules |
| DevOps | `devops-engineer` | CI/CD, IaC, containers, deploy/rollback, config/env, observability |
| SecOps | `secops-auditor` | Trust boundaries, authN/Z, input handling, secrets, crypto, PII |

**Project override:** if the repository defines its own conventions reviewer (e.g. `ddd-conventions-reviewer` in `.claude/agents/`), seat it in the DDD seat **instead of** the generic `ddd-reviewer`, never both — it knows rules the generic one cannot.

**Guests** (seated only when the task needs them; they count toward the minimum): `staff-engineer` (forward design, migration plans), `ux-ui-architect` (new surfaces/patterns), `e2e-test-engineer` (E2E coverage/flakes), `seo-inspector` (public pages).

## Size first

- Answerable from context already gathered, or one obvious fix in 1-3 files → **no council**. Do it or delegate to one implementer.
- Anything else → council with **at least 2 members**. Seat every member whose trigger fires, up to the full panel of 6. A guest takes a seat only for work no member owns.

## Seating

Seat by what the task touches. Start from the row, then add a member for every trigger that fires.

| Task | Seat | Add when |
|------|------|----------|
| **Code review** (diff, PR, branch) | Chair + DDD | FE files → FE architect · new/changed API, event, or service boundary → BE architect · CI, Dockerfile, IaC, env vars, migrations runner → DevOps · auth, input parsing, secrets, crypto, payments, PII, file upload → SecOps |
| **Bug / incident** | Chair + owner of the failing layer (BE, FE, or DevOps); layer unknown → every candidate owner | Symptom crosses layers → both owners · data leak, auth bypass, injection → SecOps · prod-only / deploy-correlated → DevOps |
| **New feature / design** | BE architect + FE architect | Domain model changes → DDD · new deployable, queue, bucket, cron → DevOps · new trust boundary or external integration → SecOps · Chair reviews the merged proposal |
| **Contract change** (API shape, auth, event schema) | BE architect proposes, FE architect responds | Chair rules if they disagree. One round each, no further back-and-forth. Skip when the contract exists and is only consumed |
| **Refactor / migration plan** | Chair + owner architect | Touches the domain → DDD · schema/data migration → DevOps · forward plan needed → `staff-engineer` guest |
| **Infra / deploy change** | DevOps + SecOps | Chair when it changes rollout/rollback or a one-way door |
| **Security question / audit** | SecOps + owner architect | Infra exposure (IAM, network, buckets) → DevOps |

UI work on a new surface or pattern: `ux-ui-architect` direction → FE architect feasibility → implementer. Changes confined to existing components skip the UX guest.

## Brief

Send the same brief to every seated member, **in parallel, in one message**. Members answer independently; nobody sees another's answer in round one, so nobody anchors.

Every brief has these parts, in this order:

1. **Goal** — one sentence; the problem, not your hypothesis.
2. **Scope** — exact files, dirs, diff command, or PR; forbid whole-repo scans when scope is known.
3. **Constraints and non-goals.**
4. **Your seat** — "You sit as <seat>; judge only <what the seat owns>; one line for anything outside it."
5. **Deliverable** — position (verdict or recommended option), findings as `[blocker|high|medium|low] file:line — issue — evidence — fix`, confidence (high/medium/low), max ~400 words.

For a review, hand over the code or the diff command, never your conclusion about it.

## Conflict → the principal decides

A conflict is two members giving incompatible answers on the same point: one calls it a blocker, the other calls it fine; or they recommend different options.

1. Open every line a member cites as evidence. A claim whose cited line does not say what the member claims loses before the chair sees it.
2. List each remaining conflict as: point, position A + evidence, position B + evidence, who holds each.
3. Send all conflicts to `principal-engineer` in **one** call: "Rule on each conflict. For each: ruling, one-line reason, and which evidence decided it. If you hold one of the positions, rebut the other's evidence point by point before ruling."
4. The ruling is final for this run. No second round, no re-asking the losing member.
5. Keep the dissent in the report. A one-way door (schema, public API, event contract, data deletion) ruled against a member's evidence goes to the user as a flagged decision, with the ruling as the recommendation.

Not a conflict: members covering different points, or one member raising something another did not mention. Merge those; do not send them to the chair.

## Before reporting

- Verify every blocker against the code yourself (read the cited line). Drop what you cannot confirm and say it was dropped.
- Deduplicate: the same issue from two members is one finding, credited to both.
- Implementation goes to implementers (`backend-engineer`, `frontend-engineer`, `e2e-test-engineer`), never to council members. Each implementer brief: goal, files, non-goals, deliverable, verification command.

## Output

1. **Verdict** — one line: Approve / Approve with changes / Needs changes / Wrong direction (review), or the chosen option (design), or the root cause (bug).
2. **Seated** — members and why each was seated, one line.
3. **Findings** — by severity, `[sev] file:line — issue — fix (raised by: seat)`. Max 3 low.
4. **Conflicts** — point, positions, principal's ruling. Omit when none.
5. **Next action** — the single next step, then at most 2 follow-ups.

## Common mistakes

- Seating one member and calling it a council. Minimum is two.
- Seating all six for a 20-line diff when only two triggers fire. Seat by trigger, not by habit.
- Asking members sequentially and pasting answer A into brief B. That turns a panel into an echo.
- Settling a conflict yourself because one side "sounds right". The chair rules.
- Reporting a member's blocker without opening the cited line.
