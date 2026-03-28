# Unified Agent & Skill Orchestration

**Date:** 2026-03-28
**Status:** Approved

## Problem

Agents and skills are duplicated across 3 platform directories (`.claude/`, `.codex/`, `.config/opencode/`). The body content is identical — only YAML frontmatter differs per platform (model, temperature, occasionally description). This duplication causes drift, makes updates error-prone, and scales poorly as new platforms are added.

## Decision

Introduce a single source of truth under `src/agents/` and `src/skills/` with no frontmatter. An `agents.config.json` file defines all metadata and platform-specific overrides. A TypeScript build script (`src/build.ts`) generates the platform-specific output directories. The project uses **pnpm** as the package manager and targets **ES2022**.

## Directory Structure

```
ai-agents/
├── src/
│   ├── agents/                       # Source of truth — pure markdown, no frontmatter
│   │   ├── backend-architect.md
│   │   ├── backend-engineer.md
│   │   ├── content-writer.md
│   │   ├── devops-engineer.md
│   │   ├── e2e-test-engineer.md
│   │   ├── frontend-architect.md
│   │   ├── frontend-engineer.md
│   │   ├── it-task-master.md
│   │   ├── principal-engineer.md
│   │   ├── secops-auditor.md
│   │   ├── seo-inspector.md
│   │   ├── staff-engineer.md
│   │   ├── team-manager.md
│   │   └── ux-ui-architect.md
│   └── skills/                       # Source of truth — skill dirs with SKILL.md and sub-files
│       ├── code-review/
│       ├── fastify/
│       ├── ... (22 skill directories total)
│       └── tech-arch-research/
├── agents.config.json                # All metadata + per-platform overrides
├── src/build.ts                      # TypeScript build script
├── package.json                      # pnpm project config
├── pnpm-lock.yaml
├── tsconfig.json                     # ES2022, NodeNext
├── .claude/                          # GENERATED — do not edit
│   ├── agents/
│   └── skills/
├── .codex/                           # GENERATED — do not edit
│   ├── agents/
│   └── skills/
├── .config/opencode/                 # GENERATED — do not edit
│   ├── agents/
│   └── skills/
├── sync-local-agents.sh              # Deploys generated output to local tool dirs (unchanged)
├── CLAUDE.md
├── AGENTS.md
├── GEMINI.md
├── WARP.md
└── README.md
```

## Config Schema: `agents.config.json`

```json
{
  "platforms": {
    "claude": {
      "outputDir": ".claude",
      "defaults": {
        "model": "sonnet"
      }
    },
    "codex": {
      "outputDir": ".codex",
      "defaults": {
        "model": "openai/gpt-5.4"
      }
    },
    "opencode": {
      "outputDir": ".config/opencode",
      "defaults": {
        "model": "openai/gpt-5.3-codex",
        "temperature": 0.1
      }
    }
  },
  "agents": {
    "backend-architect": {
      "description": "Use this agent when you need expert guidance on backend architecture decisions, domain modeling, microservices design, event-driven system architecture, or when refactoring complex business logic in Node.js/TypeScript applications. Examples include designing bounded contexts for a new feature, evaluating event sourcing strategies, reviewing aggregate design, planning service decomposition, or architecting inter-service communication patterns.",
      "color": "blue",
      "overrides": {}
    },
    "backend-engineer": {
      "description": "Use this agent to implement backend services, API endpoints, domain models, and tests following DDD, EDA, and microservices patterns. Handles code implementation, refactoring, test writing, and architectural reviews for distributed backend systems.",
      "color": "green",
      "overrides": {
        "opencode": { "temperature": 0.4 }
      }
    },
    "content-writer": {
      "description": "Use this agent to plan, write, and refine technical blog content that earns attention, builds trust, and drives action. It specializes in developer-facing articles, thought leadership, tutorials, comparison pieces, and product-adjacent educational content with strong hooks, clear structure, and search-aware execution.",
      "color": "orange",
      "overrides": {
        "opencode": { "model": "openai/gpt-5.4", "temperature": 0.3 }
      }
    },
    "devops-engineer": {
      "description": "Use this agent when you need practical, production-ready DevOps guidance to design, automate, and operate infrastructure, including IaC, CI/CD pipelines, containers and Kubernetes, cloud architecture, reliability and scaling, and day-2 operations with strong observability and security.",
      "color": "purple",
      "overrides": {}
    },
    "e2e-test-engineer": {
      "description": "Use this agent when you need to create, review, or optimize end-to-end tests using Playwright. This includes writing new E2E test suites for features or user workflows, reviewing existing E2E test code for best practices and maintainability, debugging flaky or failing E2E tests, setting up or maintaining CI/CD pipeline configurations for E2E testing, optimizing test performance and execution strategies, providing guidance on test architecture, page object models, and test organization, refactoring legacy E2E tests for better reliability.",
      "color": "cyan",
      "overrides": {}
    },
    "frontend-architect": {
      "description": "Expert in modern web architecture, performance, and component design. You are the technical lead. You decide \"how\" the system is built and how data flows through it.",
      "color": "orange",
      "overrides": {}
    },
    "frontend-engineer": {
      "description": "Use this agent when the user needs to define high-level technical strategies, project structures, or complex data flow patterns. This includes choosing the technology stack, setting up state management architecture, implementing API integration layers, and establishing coding standards for TypeScript environments. This agent handles the structural integrity and scalability of the application rather than granular UI implementation.",
      "color": "yellow",
      "overrides": {
        "opencode": { "temperature": 0.4 }
      }
    },
    "it-task-master": {
      "description": "Use this agent as the primary orchestrator for multi-step work. It decomposes the user's request, delegates to the best specialized agents, coordinates dependencies, integrates results, and verifies completion.",
      "color": "orange",
      "overrides": {
        "opencode": { "model": "openai/gpt-5.4" }
      }
    },
    "principal-engineer": {
      "description": "Use this agent when you need expert guidance on technical leadership at the principal level, including comprehensive code reviews, technical strategy, architecture decisions, mentoring, and organizational technical influence. This agent combines deep technical expertise with leadership responsibilities across multiple technology stacks.",
      "color": "red",
      "overrides": {}
    },
    "secops-auditor": {
      "description": "Use this agent when you need expert security operations guidance, security architecture review, or threat analysis for microservices-based systems. Invoke this agent if user is developing a new API gateway for a microservices architecture and needs security validation.",
      "color": "yellow",
      "overrides": {}
    },
    "seo-inspector": {
      "description": "Use this agent to audit, design, and improve SEO for modern websites and web applications. It covers technical SEO, content architecture, Core Web Vitals, structured data, internationalization, AI search readiness, and future-facing discoverability patterns for both classic search engines and answer engines.",
      "color": "yellow",
      "overrides": {
        "opencode": { "model": "openai/gpt-5.4" }
      }
    },
    "staff-engineer": {
      "description": "Use this agent when you need guidance on technical leadership, cross-team technical coordination, system architecture decisions, technical mentoring, or strategic technical planning. Examples include defining technical standards, solving complex technical problems, coordinating large technical initiatives, or providing technical direction across teams.",
      "color": "purple",
      "overrides": {}
    },
    "team-manager": {
      "description": "Use this agent when you need guidance on people management, team leadership, project delivery, performance management, or organizational challenges. Examples include team planning, handling conflicts, performance reviews, stakeholder communication, resource allocation, or career development strategies.",
      "color": "green",
      "overrides": {}
    },
    "ux-ui-architect": {
      "description": "Use this agent if there are considering any frontend application, any changes to components. Everything that could have an impact for UX and UI in any application.",
      "color": "cyan",
      "overrides": {
        "opencode": { "model": "openai/gpt-5.4", "temperature": 0.7 }
      }
    }
  },
  "skills": {
    "copyOnly": true
  }
}
```

## Toolchain

- **Package manager:** pnpm
- **Language:** TypeScript (ES2022, NodeNext module resolution)
- **Dependencies:** `js-yaml` for YAML serialization (frontmatter generation)
- **Dev dependencies:** `typescript`, `@types/node`
- **Scripts:**
  - `pnpm build` — runs `tsx src/build.ts` (generates all platform dirs)
  - `pnpm sync` — runs `./sync-local-agents.sh` (deploys to local tool dirs)
- **tsconfig.json:** `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `outDir: dist`

## Build Script Behavior (`src/build.ts`)

### Agent Build

For each platform defined in `platforms`, for each agent in `agents`:

1. Read `src/agents/{agentName}.md` (pure body content)
2. Compute frontmatter by deep-merging in order:
   - `platforms[platform].defaults` (base: model, temperature)
   - Agent shared fields: `{ name: agentName, description, color }`
   - `agents[agentName].overrides[platform]` (platform-specific overrides)
3. Serialize as YAML frontmatter + `---\n` + body content
4. Prepend `<!-- GENERATED FILE — DO NOT EDIT. Source: src/agents/{name}.md -->\n` as an HTML comment
5. Write to `{outputDir}/agents/{agentName}.md`

### Skill Build

Skills are content-identical across platforms — no frontmatter transformation needed:

1. For each platform, recursively copy `src/skills/` → `{outputDir}/skills/`
2. Preserve directory structure (e.g., `fastify/` with its rule subdirectories)

### Merge Logic

```
finalFrontmatter = {
  ...platformDefaults,        // e.g. { model: "sonnet" }
  name: agentName,            // derived from filename
  description: agent.description,
  color: agent.color,
  ...agent.overrides[platform] // e.g. { temperature: 0.4 }
}
```

Null/undefined values are omitted from the output frontmatter (e.g., if temperature is not set for Claude, it won't appear).

## Workflow

```
Edit source          Edit config           Run build
src/agents/*.md  +  agents.config.json  →  pnpm build (tsx src/build.ts)
                                            ↓
                              .claude/  .codex/  .config/opencode/
                                            ↓
                              pnpm sync (sync-local-agents.sh)
```

## What Changes

| Item | Before | After |
|------|--------|-------|
| Agent source | 3 copies in platform dirs | 1 copy in `src/agents/` |
| Skill source | 3 copies in platform dirs | 1 copy in `src/skills/` |
| Metadata | Embedded in each file's frontmatter | Centralized in `agents.config.json` |
| Adding a new agent | Create 3 files with different frontmatter | Create 1 file + 1 config entry |
| Adding a new platform | Copy all agents, change all frontmatter | Add 1 platform entry in config |
| `sync-local-agents.sh` | Unchanged | Unchanged |
| `.gitignore` | No changes needed — generated dirs stay tracked for tool compatibility |

## Edge Cases

- **Name inconsistency:** Current `secops-auditor` (Claude) vs `secops-security-auditor` (Codex/OpenCode). Unified to `secops-auditor` as the canonical filename. The `name` field in frontmatter will match the filename.
- **Description variants:** `backend-engineer` has an expanded description in Codex/OpenCode with usage examples. The unified description includes the examples (richer is better).
- **Skills with subdirectories:** `fastify/` has 17+ rule subdirectories. These are copied recursively as-is.

## Out of Scope

- CLAUDE.md, AGENTS.md, GEMINI.md, WARP.md, README.md updates (can be done separately)
- CI/CD integration for the build step
- Automated validation of config schema
