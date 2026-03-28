import { Command } from "commander";
import { syncPlatform, resolveLocalDir } from "../lib/sync.ts";
import { runBuild } from "./build.ts";

export const syncCommand = new Command("sync")
  .description("Build and deploy generated files to local tool config directories")
  .option("--dry-run", "Preview changes without writing files", false)
  .option("--delete", "Remove local files that no longer exist in source", false)
  .option("--platform <name...>", "Sync only specified platforms")
  .action((options) => {
    const config = runBuild();

    const platformNames: string[] = options.platform ?? Object.keys(config.platforms);

    for (const name of platformNames) {
      const platform = config.platforms[name];
      if (!platform) {
        console.error(`Unknown platform: ${name}`);
        process.exit(1);
      }

      const sourceDir = platform.outputDir;
      const targetDir = resolveLocalDir(platform.localDir);

      console.log(`Syncing ${name}: ${sourceDir} → ${targetDir}`);
      syncPlatform(sourceDir, targetDir, {
        dryRun: options.dryRun,
        delete: options.delete,
      });
    }

    console.log("Sync complete.");
  });
