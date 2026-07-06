---
name: tech-arch-research
description: "Use when asked to investigate technical risks, compare options, propose architectures, plan migrations or dependency upgrades, or produce ADR/RFC/plan documents - including CVE and dependency risk analysis."
---

# Tech Architecture Research

## Core workflow

1. Confirm goals and constraints

- Identify the target outcome, security/compliance drivers, and time horizon.
- Capture environment constraints: runtime, infra, CI/CD, network access, and repo boundaries.

2. Gather local evidence

- Prefer repo data first: `package.json`, lockfiles, Docker/CI configs, service entrypoints.
- Extract concrete versions and dependency edges from lockfiles or installed metadata.
- Record evidence with file paths for traceability.

3. Research upstream inputs

- Identify authoritative sources: release notes, migration guides, CVEs, vendor advisories.
- If network access is blocked, state the limitation and proceed with local evidence; flag any gaps.

4. Analyze options and impact

- Provide 2-3 viable remediation options with tradeoffs.
- Assess compatibility risks (API changes, peer deps, runtime versions, plugin ecosystems).
- Highlight cross-service impact in monorepos.

5. Produce a decision-ready plan

- Include steps, validation, rollback, and monitoring guidance.
- Add a testing checklist aligned with repo scripts.
- Provide a clear recommendation with rationale.

## Output guidelines

- Default format: Markdown with short headings and checklists.
- Separate facts (evidence) from hypotheses (assumptions).
- For each recommendation, include: scope, changes, risks, tests, and rollout.

## Output structure (canonical)

```
# Title

## Summary

## Current state (evidence)
- File/path references

## Options
- Option A
- Option B
- Option C

## Recommendation

## Remediation plan
- Step-by-step

## Validation

## Rollback

## Open questions
```
