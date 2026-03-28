import { Command } from "commander";
import { resolve, join } from "node:path";
import { loadConfig } from "../lib/config.ts";
import { syncPlatform, resolveLocalDir } from "../lib/sync.ts";

export const syncCommand = new Command("sync")
  .description("Deploy generated files to local tool config directories")
  .option("--dry-run", "Preview changes without writing files", false)
  .option("--delete", "Remove local files that no longer exist in source", false)
  .option("--platform <name...>", "Sync only specified platforms")
  .action((options) => {
    const rootDir = resolve(import.meta.dirname, "../..");
    const configPath = join(rootDir, "agents.config.json");
    const config = loadConfig(configPath);

    const platformNames: string[] = options.platform ?? Object.keys(config.platforms);

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
        dryRun: options.dryRun,
        delete: options.delete,
      });
    }

    console.log("Sync complete.");
  });
