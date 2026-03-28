# Unified Agent & Skill Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate duplicated agents and skills across 3 platform directories into a single source of truth with config-driven build output.

**Architecture:** Source markdown files (no frontmatter) live in `src/agents/` and `src/skills/`. An `agents.config.json` defines all metadata and per-platform overrides. A TypeScript build script reads config + source, generates platform-specific output to `.claude/`, `.codex/`, `.config/opencode/`.

**Tech Stack:** TypeScript (ES2022, NodeNext), pnpm, tsx, js-yaml, Node.js fs/path APIs, vitest for testing

**Spec:** `docs/superpowers/specs/2026-03-28-unified-agent-orchestration-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | pnpm project config, scripts (`build`, `sync`, `test`) |
| `tsconfig.json` | ES2022, NodeNext, strict mode |
| `agents.config.json` | All agent/skill metadata + per-platform overrides |
| `src/build.ts` | Main build script — reads config, generates platform dirs |
| `src/sync.ts` | Sync script — deploys generated output to local tool dirs (~/.claude, etc.) |
| `src/types.ts` | TypeScript interfaces for config schema |
| `src/build.test.ts` | Tests for build logic |
| `src/sync.test.ts` | Tests for sync logic |
| `src/agents/*.md` | Source agent files (pure markdown, no frontmatter) |
| `src/skills/*/` | Source skill directories (copied as-is) |

---

### Task 1: Initialize pnpm project and TypeScript config

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Initialize pnpm project**

Run:
```bash
cd /Users/bartek/Projects/ai-agents && pnpm init
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
pnpm add js-yaml && pnpm add -D typescript @types/node @types/js-yaml tsx vitest
```

- [ ] **Step 3: Create tsconfig.json**

Write `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Add scripts to package.json**

Edit `package.json` to set `"type": "module"` and add scripts:
```json
{
  "type": "module",
  "scripts": {
    "build": "tsx src/build.ts",
    "sync": "tsx src/sync.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Update .gitignore**

Append to `.gitignore`:
```
node_modules/
dist/
```

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json pnpm-lock.yaml .gitignore
git commit -m "chore: initialize pnpm project with TypeScript ES2022"
```

---

### Task 2: Define TypeScript types for config schema

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write the types file**

Write `src/types.ts`:
```typescript
export interface PlatformConfig {
  outputDir: string;
  localDir: string;
  defaults: Record<string, string | number>;
}

export interface AgentConfig {
  description: string;
  color: string;
  overrides: Record<string, Record<string, string | number>>;
}

export interface SkillsConfig {
  copyOnly: boolean;
}

export interface Config {
  platforms: Record<string, PlatformConfig>;
  agents: Record<string, AgentConfig>;
  skills: SkillsConfig;
}

export interface SyncOptions {
  dryRun: boolean;
  delete: boolean;
  platforms: string[];
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
pnpm tsx --eval "import './src/types.ts'; console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript types for agents config schema"
```

---

### Task 3: Create agents.config.json

**Files:**
- Create: `agents.config.json`

- [ ] **Step 1: Write the config file**

Write `agents.config.json` with the full config from the spec. This is the complete file:

```json
{
  "platforms": {
    "claude": {
      "outputDir": ".claude",
      "localDir": "~/.claude",
      "defaults": {
        "model": "sonnet"
      }
    },
    "codex": {
      "outputDir": ".codex",
      "localDir": "~/.codex",
      "defaults": {
        "model": "openai/gpt-5.4"
      }
    },
    "opencode": {
      "outputDir": ".config/opencode",
      "localDir": "~/.config/opencode",
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

- [ ] **Step 2: Commit**

```bash
git add agents.config.json
git commit -m "feat: add centralized agents config with platform overrides"
```

---

### Task 4: Extract source agent files (strip frontmatter)

**Files:**
- Create: `src/agents/backend-architect.md` (and 13 more)

- [ ] **Step 1: Create src/agents/ directory**

```bash
mkdir -p src/agents
```

- [ ] **Step 2: Strip frontmatter from each Claude agent and copy to src/agents/**

For each of the 14 agents in `.claude/agents/`, strip the YAML frontmatter (the `---` block at the top) and write the remaining body content to `src/agents/{name}.md`.

The frontmatter to strip looks like:
```
---
name: backend-architect
description: ...
model: sonnet
color: blue
---
```

Everything after the closing `---` is the body content. Write that (trimming leading blank line) to `src/agents/{name}.md`.

Do this for all 14 agents:
- backend-architect.md
- backend-engineer.md
- content-writer.md
- devops-engineer.md
- e2e-test-engineer.md
- frontend-architect.md
- frontend-engineer.md
- it-task-master.md
- principal-engineer.md
- secops-auditor.md
- seo-inspector.md
- staff-engineer.md
- team-manager.md
- ux-ui-architect.md

- [ ] **Step 3: Verify file count**

Run:
```bash
ls src/agents/ | wc -l
```
Expected: `14`

- [ ] **Step 4: Spot-check one file has no frontmatter**

Run:
```bash
head -3 src/agents/backend-architect.md
```
Expected: Should start with the body content (e.g., `You are a senior backend architect...`), NOT with `---`.

- [ ] **Step 5: Commit**

```bash
git add src/agents/
git commit -m "feat: extract agent source files without frontmatter"
```

---

### Task 5: Extract source skill files

**Files:**
- Create: `src/skills/` (22 skill directories, copied from `.claude/skills/`)

- [ ] **Step 1: Copy skills from .claude/skills/ to src/skills/**

```bash
cp -R .claude/skills/ src/skills/
```

Skills are identical across platforms, so `.claude/skills/` is the canonical source.

- [ ] **Step 2: Verify directory count**

Run:
```bash
ls -d src/skills/*/ | wc -l
```
Expected: `22`

- [ ] **Step 3: Verify fastify subdirectories preserved**

Run:
```bash
ls src/skills/fastify/rules/ | head -5
```
Expected: Should list rule subdirectories (authentication, configuration, etc.)

- [ ] **Step 4: Commit**

```bash
git add src/skills/
git commit -m "feat: extract skill source files to src/skills"
```

---

### Task 6: Write build script tests

**Files:**
- Create: `src/build.test.ts`

- [ ] **Step 1: Write the test file**

Write `src/build.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildAgents, buildSkills, loadConfig } from "./build.ts";

const FIXTURES_DIR = join(import.meta.dirname, "__fixtures__");
const OUTPUT_DIR = join(FIXTURES_DIR, "output");

function setupFixtures() {
  mkdirSync(join(FIXTURES_DIR, "agents"), { recursive: true });
  mkdirSync(join(FIXTURES_DIR, "skills", "test-skill"), { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  writeFileSync(
    join(FIXTURES_DIR, "agents", "test-agent.md"),
    "You are a test agent.\n\n## Responsibilities\n\n- Test things\n"
  );

  writeFileSync(
    join(FIXTURES_DIR, "skills", "test-skill", "SKILL.md"),
    "---\nname: test-skill\n---\nSkill content here.\n"
  );
}

function cleanupFixtures() {
  if (existsSync(FIXTURES_DIR)) {
    rmSync(FIXTURES_DIR, { recursive: true, force: true });
  }
}

const TEST_CONFIG = {
  platforms: {
    claude: {
      outputDir: join(OUTPUT_DIR, ".claude"),
      localDir: "~/.claude",
      defaults: { model: "sonnet" },
    },
    codex: {
      outputDir: join(OUTPUT_DIR, ".codex"),
      localDir: "~/.codex",
      defaults: { model: "openai/gpt-5.4" },
    },
  },
  agents: {
    "test-agent": {
      description: "A test agent for unit tests.",
      color: "blue",
      overrides: {
        codex: { temperature: 0.3 },
      },
    },
  },
  skills: { copyOnly: true },
};

describe("loadConfig", () => {
  it("reads and parses agents.config.json", () => {
    const config = loadConfig(join(process.cwd(), "agents.config.json"));
    expect(config.platforms).toBeDefined();
    expect(config.agents).toBeDefined();
    expect(config.platforms.claude.outputDir).toBe(".claude");
  });
});

describe("buildAgents", () => {
  beforeEach(setupFixtures);
  afterEach(cleanupFixtures);

  it("generates agent files with correct YAML frontmatter for each platform", () => {
    buildAgents(TEST_CONFIG, join(FIXTURES_DIR, "agents"));

    const claudeFile = readFileSync(
      join(OUTPUT_DIR, ".claude", "agents", "test-agent.md"),
      "utf-8"
    );
    expect(claudeFile).toContain("<!-- GENERATED FILE");
    expect(claudeFile).toContain("---");
    expect(claudeFile).toContain("name: test-agent");
    expect(claudeFile).toContain("model: sonnet");
    expect(claudeFile).toContain("color: blue");
    expect(claudeFile).toContain("You are a test agent.");
    expect(claudeFile).not.toContain("temperature");

    const codexFile = readFileSync(
      join(OUTPUT_DIR, ".codex", "agents", "test-agent.md"),
      "utf-8"
    );
    expect(codexFile).toContain("model: openai/gpt-5.4");
    expect(codexFile).toContain("temperature: 0.3");
    expect(codexFile).toContain("You are a test agent.");
  });

  it("omits undefined values from frontmatter", () => {
    buildAgents(TEST_CONFIG, join(FIXTURES_DIR, "agents"));

    const claudeFile = readFileSync(
      join(OUTPUT_DIR, ".claude", "agents", "test-agent.md"),
      "utf-8"
    );
    expect(claudeFile).not.toContain("temperature");
  });

  it("prepends GENERATED comment to output files", () => {
    buildAgents(TEST_CONFIG, join(FIXTURES_DIR, "agents"));

    const claudeFile = readFileSync(
      join(OUTPUT_DIR, ".claude", "agents", "test-agent.md"),
      "utf-8"
    );
    expect(claudeFile.startsWith("<!-- GENERATED FILE")).toBe(true);
  });
});

describe("buildSkills", () => {
  beforeEach(setupFixtures);
  afterEach(cleanupFixtures);

  it("copies skill directories to each platform output", () => {
    buildSkills(TEST_CONFIG, join(FIXTURES_DIR, "skills"));

    const claudeSkill = readFileSync(
      join(OUTPUT_DIR, ".claude", "skills", "test-skill", "SKILL.md"),
      "utf-8"
    );
    expect(claudeSkill).toContain("Skill content here.");

    const codexSkill = readFileSync(
      join(OUTPUT_DIR, ".codex", "skills", "test-skill", "SKILL.md"),
      "utf-8"
    );
    expect(codexSkill).toContain("Skill content here.");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm test
```
Expected: FAIL — `buildAgents`, `buildSkills`, `loadConfig` are not exported from `./build.ts` yet.

- [ ] **Step 3: Commit**

```bash
git add src/build.test.ts
git commit -m "test: add build script tests (red phase)"
```

---

### Task 7: Implement the build script

**Files:**
- Create: `src/build.ts`

- [ ] **Step 1: Write the build script**

Write `src/build.ts`:
```typescript
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import yaml from "js-yaml";
import type { Config, AgentConfig, PlatformConfig } from "./types.ts";

export function loadConfig(configPath: string): Config {
  const raw = readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as Config;
}

function buildFrontmatter(
  agentName: string,
  agent: AgentConfig,
  platform: PlatformConfig,
  platformName: string
): Record<string, string | number> {
  const merged: Record<string, string | number> = {};

  // 1. Platform defaults
  for (const [key, value] of Object.entries(platform.defaults)) {
    merged[key] = value;
  }

  // 2. Shared agent fields
  merged.name = agentName;
  merged.description = agent.description;
  merged.color = agent.color;

  // 3. Per-platform overrides
  const overrides = agent.overrides[platformName];
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      merged[key] = value;
    }
  }

  return merged;
}

export function buildAgents(config: Config, sourceDir: string): void {
  const agentFiles = readdirSync(sourceDir).filter((f) => f.endsWith(".md"));

  for (const [platformName, platform] of Object.entries(config.platforms)) {
    const outputAgentsDir = join(platform.outputDir, "agents");
    mkdirSync(outputAgentsDir, { recursive: true });

    for (const file of agentFiles) {
      const agentName = basename(file, ".md");
      const agentConfig = config.agents[agentName];

      if (!agentConfig) {
        console.warn(`Warning: No config entry for agent "${agentName}", skipping.`);
        continue;
      }

      const body = readFileSync(join(sourceDir, file), "utf-8");
      const frontmatter = buildFrontmatter(agentName, agentConfig, platform, platformName);

      const yamlStr = yaml.dump(frontmatter, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
      }).trimEnd();

      const output = [
        `<!-- GENERATED FILE — DO NOT EDIT. Source: src/agents/${agentName}.md -->`,
        "---",
        yamlStr,
        "---",
        "",
        body,
      ].join("\n");

      writeFileSync(join(outputAgentsDir, file), output);
    }
  }
}

export function buildSkills(config: Config, sourceDir: string): void {
  for (const platform of Object.values(config.platforms)) {
    const outputSkillsDir = join(platform.outputDir, "skills");
    rmSync(outputSkillsDir, { recursive: true, force: true });
    cpSync(sourceDir, outputSkillsDir, { recursive: true });
  }
}

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");
  const configPath = join(rootDir, "agents.config.json");
  const agentsSourceDir = join(rootDir, "src", "agents");
  const skillsSourceDir = join(rootDir, "src", "skills");

  console.log("Loading config...");
  const config = loadConfig(configPath);

  // Resolve outputDir paths relative to rootDir
  for (const platform of Object.values(config.platforms)) {
    platform.outputDir = join(rootDir, platform.outputDir);
  }

  const platformNames = Object.keys(config.platforms);
  const agentNames = Object.keys(config.agents);
  console.log(`Platforms: ${platformNames.join(", ")}`);
  console.log(`Agents: ${agentNames.length}`);

  console.log("Building agents...");
  buildAgents(config, agentsSourceDir);

  console.log("Building skills...");
  buildSkills(config, skillsSourceDir);

  console.log("Done.");
}

// Run main when executed directly
const isDirectRun = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (isDirectRun) {
  main();
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
pnpm test
```
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/build.ts
git commit -m "feat: implement build script for agent and skill generation"
```

---

### Task 8: Run full build and verify output

**Files:**
- Modify: `.claude/agents/*.md` (regenerated)
- Modify: `.codex/agents/*.md` (regenerated)
- Modify: `.config/opencode/agents/*.md` (regenerated)

- [ ] **Step 1: Run the build**

Run:
```bash
pnpm build
```
Expected output:
```
Loading config...
Platforms: claude, codex, opencode
Agents: 14
Building agents...
Building skills...
Done.
```

- [ ] **Step 2: Verify Claude output has correct frontmatter**

Run:
```bash
head -10 .claude/agents/backend-architect.md
```
Expected:
```
<!-- GENERATED FILE — DO NOT EDIT. Source: src/agents/backend-architect.md -->
---
name: backend-architect
description: Use this agent when you need expert guidance...
model: sonnet
color: blue
---

You are a senior backend architect...
```

- [ ] **Step 3: Verify Codex output has different model**

Run:
```bash
head -8 .codex/agents/backend-architect.md
```
Expected: Should contain `model: openai/gpt-5.4`

- [ ] **Step 4: Verify OpenCode output has temperature**

Run:
```bash
head -10 .config/opencode/agents/backend-architect.md
```
Expected: Should contain `model: openai/gpt-5.3-codex` and `temperature: 0.1`

- [ ] **Step 5: Verify OpenCode content-writer has overridden model**

Run:
```bash
head -10 .config/opencode/agents/content-writer.md
```
Expected: Should contain `model: openai/gpt-5.4` and `temperature: 0.3` (overridden from default)

- [ ] **Step 6: Verify principal-engineer exists in all platforms (was Claude-only)**

Run:
```bash
ls .claude/agents/principal-engineer.md .codex/agents/principal-engineer.md .config/opencode/agents/principal-engineer.md
```
Expected: All 3 files listed without error.

- [ ] **Step 7: Verify skills were copied to all platforms**

Run:
```bash
ls .claude/skills/fastify/rules/ | head -3
ls .codex/skills/fastify/rules/ | head -3
ls .config/opencode/skills/fastify/rules/ | head -3
```
Expected: Same rule directories across all 3.

- [ ] **Step 8: Verify agent file count per platform**

Run:
```bash
echo "claude: $(ls .claude/agents/*.md | wc -l)"
echo "codex: $(ls .codex/agents/*.md | wc -l)"
echo "opencode: $(ls .config/opencode/agents/*.md | wc -l)"
```
Expected: All show `14`.

- [ ] **Step 9: Commit the regenerated output**

```bash
git add .claude/ .codex/ .config/opencode/
git commit -m "build: regenerate platform dirs from unified source"
```

---

### Task 9: Write sync script tests

**Files:**
- Create: `src/sync.test.ts`

- [ ] **Step 1: Write the sync test file**

Write `src/sync.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { syncPlatform } from "./sync.ts";

const FIXTURES_DIR = join(import.meta.dirname, "__fixtures_sync__");
const SOURCE_DIR = join(FIXTURES_DIR, "source");
const TARGET_DIR = join(FIXTURES_DIR, "target");

function setupFixtures() {
  // Source platform dir with agents and skills
  mkdirSync(join(SOURCE_DIR, "agents"), { recursive: true });
  mkdirSync(join(SOURCE_DIR, "skills", "test-skill"), { recursive: true });
  mkdirSync(TARGET_DIR, { recursive: true });

  writeFileSync(
    join(SOURCE_DIR, "agents", "test-agent.md"),
    "---\nname: test-agent\n---\nAgent content\n"
  );
  writeFileSync(
    join(SOURCE_DIR, "skills", "test-skill", "SKILL.md"),
    "Skill content\n"
  );
}

function cleanupFixtures() {
  if (existsSync(FIXTURES_DIR)) {
    rmSync(FIXTURES_DIR, { recursive: true, force: true });
  }
}

describe("syncPlatform", () => {
  beforeEach(setupFixtures);
  afterEach(cleanupFixtures);

  it("copies agents and skills from source to target", () => {
    syncPlatform(SOURCE_DIR, TARGET_DIR, { dryRun: false, delete: false });

    const agentContent = readFileSync(
      join(TARGET_DIR, "agents", "test-agent.md"),
      "utf-8"
    );
    expect(agentContent).toContain("Agent content");

    const skillContent = readFileSync(
      join(TARGET_DIR, "skills", "test-skill", "SKILL.md"),
      "utf-8"
    );
    expect(skillContent).toContain("Skill content");
  });

  it("does not write files in dry-run mode", () => {
    syncPlatform(SOURCE_DIR, TARGET_DIR, { dryRun: true, delete: false });

    expect(existsSync(join(TARGET_DIR, "agents"))).toBe(false);
  });

  it("removes extra files in target when delete is true", () => {
    // Pre-populate target with an extra file
    mkdirSync(join(TARGET_DIR, "agents"), { recursive: true });
    writeFileSync(join(TARGET_DIR, "agents", "stale-agent.md"), "old");
    writeFileSync(join(TARGET_DIR, "agents", "test-agent.md"), "old");

    syncPlatform(SOURCE_DIR, TARGET_DIR, { dryRun: false, delete: true });

    expect(existsSync(join(TARGET_DIR, "agents", "stale-agent.md"))).toBe(false);
    expect(existsSync(join(TARGET_DIR, "agents", "test-agent.md"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm test
```
Expected: FAIL — `syncPlatform` is not exported from `./sync.ts` yet.

- [ ] **Step 3: Commit**

```bash
git add src/sync.test.ts
git commit -m "test: add sync script tests (red phase)"
```

---

### Task 10: Implement the sync script

**Files:**
- Create: `src/sync.ts`

- [ ] **Step 1: Write the sync script**

Write `src/sync.ts`:
```typescript
import { cpSync, rmSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import type { Config, SyncOptions } from "./types.ts";
import { loadConfig } from "./build.ts";

interface SyncPlatformOptions {
  dryRun: boolean;
  delete: boolean;
}

export function syncPlatform(
  sourceDir: string,
  targetDir: string,
  options: SyncPlatformOptions
): void {
  const subdirs = ["agents", "skills"];

  for (const subdir of subdirs) {
    const src = join(sourceDir, subdir);
    const dest = join(targetDir, subdir);

    if (!existsSync(src)) continue;

    if (options.dryRun) {
      const files = readdirSync(src, { recursive: true });
      console.log(`  [dry-run] Would sync ${files.length} entries from ${subdir}/`);
      continue;
    }

    if (options.delete && existsSync(dest)) {
      rmSync(dest, { recursive: true, force: true });
    }

    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });
  }
}

function resolveLocalDir(localDir: string): string {
  if (localDir.startsWith("~")) {
    return join(homedir(), localDir.slice(1));
  }
  return resolve(localDir);
}

function parseArgs(args: string[]): SyncOptions {
  const options: SyncOptions = {
    dryRun: false,
    delete: false,
    platforms: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--delete":
        options.delete = true;
        break;
      case "--platform":
        i++;
        if (!args[i]) {
          console.error("Missing value for --platform");
          process.exit(1);
        }
        options.platforms.push(args[i]);
        break;
      case "--help":
      case "-h":
        console.log(`Usage: pnpm sync [--dry-run] [--delete] [--platform claude|codex|opencode]

Copies generated agents and skills from platform output dirs to local
tool config directories in your home folder.

Options:
  --dry-run            Preview changes without writing files
  --delete             Remove local files that no longer exist in source
  --platform <name>    Sync only the specified platform (can repeat)`);
        process.exit(0);
    }
  }

  return options;
}

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");
  const configPath = join(rootDir, "agents.config.json");
  const config = loadConfig(configPath);
  const args = parseArgs(process.argv.slice(2));

  const platformNames =
    args.platforms.length > 0
      ? args.platforms
      : Object.keys(config.platforms);

  for (const name of platformNames) {
    const platform = config.platforms[name];
    if (!platform) {
      console.error(`Unknown platform: ${name}`);
      process.exit(1);
    }

    const sourceDir = join(rootDir, platform.outputDir);
    const targetDir = resolveLocalDir(platform.localDir);

    console.log(`Syncing ${name}: ${sourceDir} → ${targetDir}`);
    syncPlatform(sourceDir, targetDir, {
      dryRun: args.dryRun,
      delete: args.delete,
    });
  }

  console.log("Sync complete.");
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (isDirectRun) {
  main();
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
pnpm test
```
Expected: ALL PASS

- [ ] **Step 3: Verify sync works end-to-end**

Run:
```bash
pnpm sync --dry-run
```
Expected output (something like):
```
Syncing claude: .claude → ~/.claude
  [dry-run] Would sync N entries from agents/
  [dry-run] Would sync N entries from skills/
Syncing codex: .codex → ~/.codex
  ...
Syncing opencode: .config/opencode → ~/.config/opencode
  ...
Sync complete.
```

- [ ] **Step 4: Verify single-platform sync**

Run:
```bash
pnpm sync --dry-run --platform claude
```
Expected: Only claude platform is synced.

- [ ] **Step 5: Commit**

```bash
git add src/sync.ts src/sync.test.ts
git commit -m "feat: implement TypeScript sync script to replace shell sync"
```

---

### Task 11: Remove old shell sync script

**Files:**
- Delete: `sync-local-agents.sh`

- [ ] **Step 1: Remove the old shell script**

```bash
git rm sync-local-agents.sh
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove sync-local-agents.sh, replaced by pnpm sync"
```

---

### Task 12: Final cleanup and verification

**Files:**
- Modify: `package.json` (verify final state)

- [ ] **Step 1: Run tests one final time**

Run:
```bash
pnpm test
```
Expected: ALL PASS

- [ ] **Step 2: Run build one final time to ensure idempotency**

Run:
```bash
pnpm build && git diff --stat
```
Expected: No changes (build output matches committed files).

- [ ] **Step 3: Run sync dry-run to confirm end-to-end flow**

Run:
```bash
pnpm sync --dry-run
```
Expected: Lists all 3 platforms with file counts, no errors.

- [ ] **Step 4: Final commit if any cleanup was needed**

```bash
git status
```
If clean, no commit needed. If there are changes, commit with appropriate message.
