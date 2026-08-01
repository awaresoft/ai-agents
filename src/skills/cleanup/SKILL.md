---
name: cleanup
description: "Use when the Mac feels slow, fans spin, load is high, swap grows, dev ports (3xxx/8xxx/13xxx/18xxx) stay occupied by dead dev servers, Warp leaves orphaned processes, or stale git worktrees with merged branches still run services. Also for running as a recurring watchdog via /loop."
---

# Cleanup

Fast macOS bottleneck triage + safe reclaim of CPU/RAM from dead dev-stack processes, orphaned Warp children, idle port listeners, and stale git worktrees.

## Safety policy (non-negotiable)

| Action | Policy |
|---|---|
| Kill orphaned dev process (PPID=1, parent was Warp/dev server, idle) | Auto, then report what was killed |
| Kill zombie / defunct process | Auto |
| Kill idle port listener (0 established conns, ~0% CPU, hours old, dev port) | Auto |
| Kill anything with recent CPU activity, unknown parentage, or non-dev command | Ask first, show evidence |
| `git worktree remove`, `git branch -d` | ALWAYS ask first, even when fully merged |
| Anything touching Docker containers, MongoDB data, system daemons | Ask first |

Never kill: the current shell's ancestry (check `ps -o ppid= -p $$` chain), Warp itself, Docker Desktop VM, browsers, IDEs. `kill -TERM` first; `-KILL` only if still alive after ~5s.

## Step 1 — Triage (10 seconds, run all at once)

```bash
sysctl -n vm.loadavg                      # vs core count: sysctl -n hw.ncpu
memory_pressure -Q | tail -1              # <30% free = pressure
sysctl -n vm.swapusage                    # used growing = RAM culprit exists
```

Verdict: load > cores → CPU hunt. Free < 30% OR swap used > 4 GB → RAM hunt (either alone suffices; near-full swap with healthy free % is still a RAM hunt). All fine → system is not actually bottlenecked; say so and stop.

## Step 2 — Find culprits

```bash
# Top offenders by CPU (use -m for RAM hunt)
ps -Axo pid,ppid,pcpu,pmem,etime,command -r | head -15

# Warp/dev orphans: reparented to launchd (PPID=1). Anchor on the binary basename,
# NOT a loose grep - system XPC paths match loose patterns.
ps -Axo pid,ppid,etime,command | awk '$2==1' \
  | grep -E '(^|/)(node|npm|pnpm|turbo|next-server|zsh|bash|vite|esbuild|jest|tsc|playwright|Chromium|mongod)( |$)' \
  | grep -v '^/System'

# Dev-port listeners (3xxx/8xxx/13xxx/18xxx + mongo)
lsof -nP -iTCP -sTCP:LISTEN | awk 'NR==1 || $9 ~ /:(3[0-9]{3}|8[0-9]{3}|13[0-9]{3}|18[0-9]{3}|27017)$/'

# Is a listener actually dead? No established connections + no recent CPU:
lsof -nP -iTCP:<port> -sTCP:ESTABLISHED   # empty = nobody talks to it
ps -o pcpu,etime,command -p <pid>          # 0.0 CPU + old = idle squatter
```

Warp-specific: healthy Warp children have Warp's PID as PPID (`pgrep -x stable` for Warp.app). Any dev process whose PPID is 1 but whose command line points into a project dir is an orphan from a closed tab — prime kill candidate.

Orphans come as trees (sh → pnpm → tsx → node); TERM on the root sh does NOT reap grandchildren. Collect and kill every PID in the tree:

```bash
descendants() { local p; for p in $(pgrep -P "$1"); do echo "$p"; descendants "$p"; done; }
kill -TERM <root_pid> $(descendants <root_pid>)
```

## Step 3 — Worktree audit

Stale worktree = branch already merged to devel, but the checkout (and often a dev server started from it) still exists.

```bash
cd <main-repo>
git worktree list --porcelain | awk '/^worktree /{print $2}'
git branch --merged devel | grep -E '^[* ]+(feature|fix|chore|refactor)/'

# Processes living on a worktree (cwd inside it):
lsof -a -d cwd -u "$(whoami)" -Fn | grep -i 'worktrees'
```

For each worktree whose branch is in the merged list:
1. Kill its processes per the safety policy (idle dev servers on a merged worktree = auto).
2. Check `git -C <wt> status -s` and unpushed commits (`git -C <wt> log @{u}.. 2>/dev/null` or vs devel). Dirty/unpushed → report only, do not offer removal.
3. Clean + merged → ask: "remove worktree + delete branch?" Then `git worktree remove <path>` and `git branch -d <branch>`.

Merged branch with NO worktree: list it in the confirmation bucket too ("delete merged branch <x>?") — `git branch -d` is always ask-first, worktree or not.

## Step 4 — Report

One compact table: what was killed automatically (pid, command, why), what needs confirmation, RAM/CPU reclaimed (re-run Step 1 after kills to show delta).

## Loop mode (watchdog)

When asked to run continuously, use `/loop` self-paced (20-30 min idle cadence). Each tick: run Step 1 only. Thresholds all fine → stay silent, schedule next tick. Threshold crossed (load > cores, free < 30%, swap used > 4 GB) → run Steps 2-3, apply auto-kills per policy, surface the confirmation list: "System is sluggish - top culprits below, clean up?" (in the user's language).

## Common mistakes

- Grepping process list loosely: `grep tsc` matches system XPC service paths. Always anchor on basename with `(^|/)name( |$)` and exclude `/System`.
- Killing a listener because the port "looks stale" - check ESTABLISHED connections first; an SSE/dev-proxy connection means it's live.
- `git worktree remove --force` on a dirty worktree - unpushed work dies. Dirty = report, never remove.
- Trusting `%MEM` alone on macOS - growing "used" RAM is often page cache; swap usage + memory_pressure are the real signals.
- Killing by port with `kill $(lsof -t -i:3000)` blindly - the PID may be Docker's vpnkit proxying the port; killing it hurts Docker, not the squatter.
