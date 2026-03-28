import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { syncPlatform } from "../src/lib/sync.ts";

const FIXTURES_DIR = join(import.meta.dirname, "__fixtures_sync__");
const SOURCE_DIR = join(FIXTURES_DIR, "source");
const TARGET_DIR = join(FIXTURES_DIR, "target");

function setupFixtures() {
  mkdirSync(join(SOURCE_DIR, "agents"), { recursive: true });
  mkdirSync(join(SOURCE_DIR, "skills", "test-skill"), { recursive: true });
  mkdirSync(TARGET_DIR, { recursive: true });

  writeFileSync(
    join(SOURCE_DIR, "agents", "test-agent.md"),
    "---\nname: test-agent\n---\nAgent content\n",
  );
  writeFileSync(join(SOURCE_DIR, "skills", "test-skill", "SKILL.md"), "Skill content\n");
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

    const agentContent = readFileSync(join(TARGET_DIR, "agents", "test-agent.md"), "utf-8");
    expect(agentContent).toContain("Agent content");

    const skillContent = readFileSync(
      join(TARGET_DIR, "skills", "test-skill", "SKILL.md"),
      "utf-8",
    );
    expect(skillContent).toContain("Skill content");
  });

  it("does not write files in dry-run mode", () => {
    syncPlatform(SOURCE_DIR, TARGET_DIR, { dryRun: true, delete: false });

    expect(existsSync(join(TARGET_DIR, "agents"))).toBe(false);
  });

  it("removes extra files in target when delete is true", () => {
    mkdirSync(join(TARGET_DIR, "agents"), { recursive: true });
    writeFileSync(join(TARGET_DIR, "agents", "stale-agent.md"), "old");
    writeFileSync(join(TARGET_DIR, "agents", "test-agent.md"), "old");

    syncPlatform(SOURCE_DIR, TARGET_DIR, { dryRun: false, delete: true });

    expect(existsSync(join(TARGET_DIR, "agents", "stale-agent.md"))).toBe(false);
    expect(existsSync(join(TARGET_DIR, "agents", "test-agent.md"))).toBe(true);
  });
});
