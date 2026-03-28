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
