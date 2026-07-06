# Agent & Skill Authoring Standards

Distilled 2026-07 from Anthropic official guidance (subagents docs, Agent Skills best practices, context-engineering and writing-tools engineering posts, anthropics/skills) and the strongest community libraries (wshobson/agents, obra/superpowers, claude-code-insights). Every rule below earned its place in testing or official docs; when editing agents/skills, follow this file.

## Core principle

**Sufficiency, not brevity.** "Find the minimal set of information that fully outlines expected behavior — minimal does not necessarily mean short." The failure mode of a bloated prompt is not wasted tokens but ignored rules (context rot); the failure mode of an over-cut prompt is lost expertise. Optimize the MODEL'S workload (scoped reads, bounded output, conditional depth), not the prompt's byte count.

## Agent body template (target 250-700 words)

Order matters; every section earns its tokens:

1. **Role + boundaries** (1-3 lines). One identity sentence, then explicit anti-overlap: "Defers X to <sibling-agent>." Boundaries prevent misrouting and duplicate doctrine.
2. **When invoked** (3-5 numbered steps). Startup procedure: what to read/run first, in what order. This is the highest-leverage section in official examples.
3. **Domain doctrine** as terse decision heuristics. One-line bullets that activate latent knowledge and carry the *why*: "Consider event sourcing when audit trails and temporal queries are critical." Never textbook explanations ("Claude is already very smart — only add context it doesn't have"). Group under named headings (they double as routing keywords). Prefer reasons over MUSTs.
4. **Conditional depth.** Scale output to the ask: heavyweight artifacts (diagrams, phased plans, full reports) only behind an explicit condition; scoped questions get direct answers. State both branches.
5. **Skills routing** (if applicable). Point to skills by name instead of inlining their content.
6. **`## Output`** — the contract: verdict/recommendation first, required elements, length bound. Target returned summary ~1,000-2,000 tokens. For reports >1 page, write to a file and return summary + path.
7. **`## Working Cheaply`** — shared verbatim block (see below).

### Shared Working Cheaply block

```
## Working Cheaply

Read only the files you will change or must cite; grep for symbols instead of reading directories. Never paste whole files into your answer; quote only load-bearing fragments. State assumptions in one line and proceed; ask a question only when the answer changes the outcome. Small ask → short answer; no report skeleton.
```

### What never goes in an agent body

- Persona padding ("15+ years of experience", "elite", "world-class") — zero behavioral effect.
- Capability inventories (lists of tools/frameworks the model knows) — keyword lists without decisions.
- Generic software wisdom ("write clean code", "communicate clearly", SOLID tutorials).
- Content that duplicates a sibling agent's doctrine — one owner per topic, others defer.
- Non-executable human duties (hiring, meeting facilitation, culture building).
- "Ask clarifying questions before proceeding" — subagents can't round-trip; use "state assumptions in one line and proceed."

## Descriptions (agents.config.json / skill frontmatter)

The description is the ROUTING surface. Empirically tested rule (superpowers): **when to use, never what the workflow is** — a workflow summary makes the router follow the description and skip the body.

- Agents: task-class + trigger keywords + explicit non-scope. "Use PROACTIVELY when/for <trigger>" boosts delegation.
- Skills: start with "Use when...", third person, include symptoms/error messages/synonyms users actually say, <500 chars preferred (always-paid cost), double-quoted YAML.

## Skills

Progressive disclosure, three levels with official budgets:

1. Metadata (name + description): ~100 tokens, loaded in EVERY session.
2. SKILL.md body: loaded on trigger; keep <500 lines (<5k tokens). Body = house rules, gotchas, decision heuristics, ONE canonical example per pattern — not framework docs recaps.
3. Reference files: zero cost until read. SKILL.md acts as router with load conditions ("Read rules/X.md ONLY when the task touches X; max 2-3 per task"). Keep references one level deep; files >100 lines get a table of contents at top.

Degrees of freedom: prose heuristics where multiple approaches are valid; templates where a preferred pattern exists; exact commands/scripts where operations are fragile. Scripts beat prose for deterministic operations.

Content that earns tokens: version-pinned gotchas, non-obvious sequencing/limits, house-opinionated choices, post-training-cutoff changes. Content that doesn't: anything the base model reproduces unprompted. Two stale facts are worse than an empty file — fact-check version-sensitive claims against current docs when writing them.

## Process rules

- Edit source in `src/`, never generated output; `pnpm build` to regenerate, `pnpm sync` to deploy (sync does NOT delete stale target dirs — remove deleted skills from targets manually).
- After any change: `pnpm build && pnpm test && pnpm lint`.
- When adding/removing skills, update AGENTS.md and README.md listings.
- Before trusting a new/edited skill or agent under pressure, spot-test it on a real task; a description-level A/B (does it trigger when it should, stay silent when it shouldn't) catches most routing bugs.
