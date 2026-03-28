import { cpSync, rmSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

interface SyncPlatformOptions {
  dryRun: boolean;
  delete: boolean;
}

export function syncPlatform(
  sourceDir: string,
  targetDir: string,
  options: SyncPlatformOptions,
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

export function resolveLocalDir(localDir: string): string {
  if (localDir.startsWith("~")) {
    return join(homedir(), localDir.slice(1));
  }
  return resolve(localDir);
}
