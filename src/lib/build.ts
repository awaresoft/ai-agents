import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import yaml from "js-yaml";
import type { Config, AgentConfig, PlatformConfig } from "../types.ts";

function buildFrontmatter(
  agentName: string,
  agent: AgentConfig,
  platform: PlatformConfig,
  platformName: string,
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

      const yamlStr = yaml
        .dump(frontmatter, {
          lineWidth: -1,
          quotingType: '"',
          forceQuotes: false,
        })
        .trimEnd();

      const output = [
        "---",
        yamlStr,
        "---",
        "",
        `<!-- GENERATED FILE — DO NOT EDIT. Source: src/agents/${agentName}.md -->`,
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
