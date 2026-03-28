import { Command } from "commander";
import { resolve, join } from "node:path";
import { loadConfig } from "../lib/config.ts";
import { buildAgents, buildSkills } from "../lib/build.ts";
import type { Config } from "../types.ts";

export function runBuild(): Config {
  const rootDir = resolve(import.meta.dirname, "../..");
  const configPath = join(rootDir, "agents.config.json");
  const agentsSourceDir = join(rootDir, "src", "agents");
  const skillsSourceDir = join(rootDir, "src", "skills");

  console.log("Loading config...");
  const config = loadConfig(configPath);

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

  console.log("Build complete.");
  return config;
}

export const buildCommand = new Command("build")
  .description("Generate platform-specific agent and skill files from source")
  .action(() => {
    runBuild();
  });
