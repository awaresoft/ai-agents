# statusline

Claude Code plugin: custom statusline (branch, dir, model, context/rate-limit usage, Linear ticket link, caveman/ponytail badges).

Format (1 line, `│` separators, no icons, ANSI colors):

```
devel │ doEstimate │ Fable 5 │ ctx 62% │ 5h 34% · 7d 61% │ BEA-535 [CAVEMAN][PONYTAIL]
```

Segments and sources:

1. **branch** — `git -C workspace.current_dir branch --show-current`; yellow on `devel`, red inside a worktree, green otherwise.
2. **dir** — worktree name (`git rev-parse --git-dir` ≠ `--git-common-dir` → basename of toplevel), else project dir name.
3. **model** — `model.display_name`.
4. **ctx** — `context_window.used_percentage` (native field); green <60, yellow <85, red ≥85.
5. **limits** — `rate_limits.five_hour/seven_day.used_percentage` (native; Pro/Max only, absent until first API response → segment hidden). Same color thresholds.
6. **ticket** — branch regex `[A-Z]+-[0-9]+` wins, fallback last commit subject; rendered as OSC 8 hyperlink to `https://linear.app/beautomated/issue/<ID>`.
7. **badges** — chains existing caveman/ponytail statusline scripts (latest installed version glob under `~/.claude/plugins/cache`).

Every segment guarded; missing data = segment omitted, never a crashed line. No subprocess slower than git; no network, no ccusage (native `rate_limits` made it redundant).

## Install

The `statusLine` slot is a single global command in `settings.json` — plugin manifests don't have a hook type for it, so installing this plugin does not wire itself up automatically. Point settings.json at the plugin script:

```jsonc
// ~/.claude/settings.json
"statusLine": {
  "type": "command",
  "command": "bash \"$HOME/.claude/plugins/cache/statusline/statusline/<version-hash>/scripts/statusline.sh\""
}
```

(swap in the real cache path after install, or reference this repo's synced copy directly). Only one `statusLine` command can be active at a time — remove/replace any previous one (e.g. `~/.claude/statusline/statusline.sh`).
