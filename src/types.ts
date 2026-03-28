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

export interface DocTarget {
  header: string;
  extra?: string;
}

export interface DocsConfig {
  source: string;
  targets: Record<string, DocTarget>;
}

export interface Config {
  platforms: Record<string, PlatformConfig>;
  agents: Record<string, AgentConfig>;
  skills: SkillsConfig;
  docs: DocsConfig;
}

export interface SyncOptions {
  dryRun: boolean;
  delete: boolean;
  platforms: string[];
}
