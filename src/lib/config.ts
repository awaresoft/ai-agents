import { readFileSync } from "node:fs";
import type { Config } from "../types.ts";

export function loadConfig(configPath: string): Config {
  const raw = readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as Config;
}
