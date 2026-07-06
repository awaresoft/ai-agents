---
name: grill-me
description: "Use when the user wants their plan or design stress-tested through questioning - says grill me, poke holes in this, challenge my assumptions, or asks for a hostile review of an existing plan."
---

# Grill Me

Interview the USER about their plan or design until every branch of the decision tree is resolved.

## Rules

- Ask ONE question per turn, or one tight cluster of at most 3 closely related questions. Never a wall of questions.
- With every question, state your own recommended answer and why. The user reacts to a position, not a blank.
- If a question can be answered by exploring the codebase, explore the codebase instead of asking.
- Walk each unresolved branch of the decision tree to resolution before opening a new one. No breadth-first scattering.
- Maintain a running "Decisions so far" ledger. Restate it compactly every few turns so drift is caught early.

## Asking

In Claude Code, ask via the AskUserQuestion tool when available, offering concrete options with your recommended default marked. Fall back to plain-text questions otherwise.

## Exit condition

When all branches are resolved, output the final decision list: each decision, the chosen answer, and a one-line rationale.
