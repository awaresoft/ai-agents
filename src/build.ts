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
