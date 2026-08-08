# warp-tab-title

Claude Code plugin: keeps the Warp tab in sync with the session's real working directory.

Warp's `⑂ branch` tab indicator follows the pane cwd via OSC 7, which the shell only emits at a prompt. While the Claude Code TUI runs, no prompt renders, so the tab freezes at the launch directory even after the session moves into a git worktree. This plugin re-emits OSC 7 (cwd) + OSC 0 (title) from hooks using the `terminalSequence` output field (Claude Code >= 2.1.141).

Title format:

- worktree: `🔴 <project> <TICKET> <worktree-dir>` (e.g. `🔴 doEstimate BEA-525 BEA-525-room-layer`)
- on `devel`: `🟡 no worktree <TICKET> devel`
- other branch: `🟢 no worktree <TICKET> <branch>`

Hooks: `SessionStart`, `UserPromptSubmit`, `PostToolUse(Bash|EnterWorktree|ExitWorktree)` so the tab updates mid-turn when the session enters a worktree.

Requires `jq`. Install via a local marketplace pointing at `src/plugins/`, or wire the script directly in `~/.claude/settings.json` hooks. Do not run both plugin and settings.json hooks at once (double emission, harmless but wasteful).
