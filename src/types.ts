export interface PlatformConfig {
  outputDir: string;
  localDir: string;
  defaults: Record<string, string | number>;
}

export interface AgentConfig {
  description: string;
  color: string;
  overrides: Record<string, Record<string, string | number>>;
}

export interface SkillsConfig {
  copyOnly: boolean;
}

export interface Config {
  platforms: Record<string, PlatformConfig>;
  agents: Record<string, AgentConfig>;
  skills: SkillsConfig;
}

export interface SyncOptions {
  dryRun: boolean;
  delete: boolean;
  platforms: string[];
}
