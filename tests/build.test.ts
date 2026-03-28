import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildAgents, buildSkills } from "../src/lib/build.ts";
import { loadConfig } from "../src/lib/config.ts";

const FIXTURES_DIR = join(import.meta.dirname, "__fixtures__");
const OUTPUT_DIR = join(FIXTURES_DIR, "output");

function setupFixtures() {
  mkdirSync(join(FIXTURES_DIR, "agents"), { recursive: true });
  mkdirSync(join(FIXTURES_DIR, "skills", "test-skill"), { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  writeFileSync(
    join(FIXTURES_DIR, "agents", "test-agent.md"),
    "You are a test agent.\n\n## Responsibilities\n\n- Test things\n",
  );

  writeFileSync(
    join(FIXTURES_DIR, "skills", "test-skill", "SKILL.md"),
    "---\nname: test-skill\n---\nSkill content here.\n",
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
      "utf-8",
    );
    expect(claudeFile).toContain("<!-- GENERATED FILE");
    expect(claudeFile).toContain("---");
    expect(claudeFile).toContain("name: test-agent");
    expect(claudeFile).toContain("model: sonnet");
    expect(claudeFile).toContain("color: blue");
    expect(claudeFile).toContain("You are a test agent.");
    expect(claudeFile).not.toContain("temperature");

    const codexFile = readFileSync(join(OUTPUT_DIR, ".codex", "agents", "test-agent.md"), "utf-8");
    expect(codexFile).toContain("model: openai/gpt-5.4");
    expect(codexFile).toContain("temperature: 0.3");
    expect(codexFile).toContain("You are a test agent.");
  });

  it("omits undefined values from frontmatter", () => {
    buildAgents(TEST_CONFIG, join(FIXTURES_DIR, "agents"));

    const claudeFile = readFileSync(
      join(OUTPUT_DIR, ".claude", "agents", "test-agent.md"),
      "utf-8",
    );
    expect(claudeFile).not.toContain("temperature");
  });

  it("prepends GENERATED comment to output files", () => {
    buildAgents(TEST_CONFIG, join(FIXTURES_DIR, "agents"));

    const claudeFile = readFileSync(
      join(OUTPUT_DIR, ".claude", "agents", "test-agent.md"),
      "utf-8",
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
      "utf-8",
    );
    expect(claudeSkill).toContain("Skill content here.");

    const codexSkill = readFileSync(
      join(OUTPUT_DIR, ".codex", "skills", "test-skill", "SKILL.md"),
      "utf-8",
    );
    expect(codexSkill).toContain("Skill content here.");
  });
});
