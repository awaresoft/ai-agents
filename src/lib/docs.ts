import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface DocTarget {
  header: string;
  extra?: string;
}

export interface DocsConfig {
  source: string;
  targets: Record<string, DocTarget>;
}

export function buildDocs(docsConfig: DocsConfig, rootDir: string): void {
  const sourcePath = join(rootDir, docsConfig.source);
  const sourceContent = readFileSync(sourcePath, "utf-8").trim();

  for (const [targetFile, target] of Object.entries(docsConfig.targets)) {
    const parts: string[] = [
      `<!-- GENERATED FILE — DO NOT EDIT. Source: ${docsConfig.source} -->`,
      target.header,
      sourceContent,
    ];

    if (target.extra) {
      const extraPath = join(rootDir, target.extra);
      if (existsSync(extraPath)) {
        const extraContent = readFileSync(extraPath, "utf-8").trim();
        parts.push(extraContent);
      }
    }

    const output = parts.join("\n\n") + "\n";
    writeFileSync(join(rootDir, targetFile), output);
  }
}
