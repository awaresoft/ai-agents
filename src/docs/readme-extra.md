## Configuration: `agents.config.json`

All agent metadata and platform-specific settings are centralized in `agents.config.json`.

### Structure

```json
{
  "platforms": {
    "<platform-name>": {
      "outputDir": "<generated output path>",
      "localDir": "<local tool config path>",
      "defaults": {
        "model": "<default model for this platform>",
        "temperature": 0.1
      }
    }
  },
  "agents": {
    "<agent-name>": {
      "description": "<agent description>",
      "color": "<UI color>",
      "overrides": {
        "<platform-name>": {
          "model": "<override model>",
          "temperature": 0.3
        }
      }
    }
  },
  "skills": {
    "copyOnly": true
  }
}
```

### How it works

1. **Platform defaults** — each platform defines a default `model` and optional `temperature` applied to all agents.
2. **Agent shared fields** — `description` and `color` are the same across all platforms.
3. **Per-platform overrides** — any agent can override `model`, `temperature`, or other fields for a specific platform.
4. **Merge order** — platform defaults < agent shared fields < agent platform overrides.

### Adding a new agent

1. Create `src/agents/{name}.md` with the agent's prompt content (no frontmatter).
2. Add an entry to `agents.config.json` under `"agents"` with `description`, `color`, and any `overrides`.
3. Run `pnpm build` to generate output, or `pnpm sync` to build and deploy.

### Adding a new platform

1. Add an entry to `agents.config.json` under `"platforms"` with `outputDir`, `localDir`, and `defaults`.
2. Run `pnpm build` to generate the new platform's output directory.

## Project Structure

```
src/
├── agents/           # Source of truth — pure markdown, no frontmatter
├── skills/           # Source of truth — skill directories
├── docs/             # Extra content appended to generated docs
├── cli.ts            # CLI entry point (commander)
├── commands/         # CLI commands (build, sync)
├── lib/              # Core logic (config, build, sync, docs)
└── types.ts          # TypeScript interfaces
tests/                # Vitest tests
agents.config.json    # Agent metadata + platform overrides
```

Generated output (gitignored):
- `.claude/agents/`, `.claude/skills/`
- `.codex/agents/`, `.codex/skills/`
- `.config/opencode/agents/`, `.config/opencode/skills/`
