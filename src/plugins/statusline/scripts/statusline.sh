#!/bin/bash
# Claude Code statusline: branch │ dir │ model │ ctx │ limits │ ticket [badges]
# Input: Claude Code statusline JSON on stdin (see ../README.md)

input=$(cat)

eval "$(echo "$input" | jq -r '@sh "MODEL=\(.model.display_name // "")
DIR=\(.workspace.current_dir // .cwd // "")
CTX=\(.context_window.used_percentage // "" | tostring)
H5=\(.rate_limits.five_hour.used_percentage // "" | tostring)
D7=\(.rate_limits.seven_day.used_percentage // "" | tostring)"' 2>/dev/null)"

RESET=$'\033[0m'
DIM=$'\033[2m'
SEP=" ${DIM}│${RESET} "
segs=()

pct_color() { # $1 = integer percent
  if [ "$1" -ge 85 ] 2>/dev/null; then printf '\033[31m'
  elif [ "$1" -ge 60 ] 2>/dev/null; then printf '\033[33m'
  else printf '\033[32m'; fi
}

# --- git: branch + worktree ---
BRANCH="" IS_WT=0 TOPNAME=""
if [ -n "$DIR" ] && git -C "$DIR" rev-parse --git-dir >/dev/null 2>&1; then
  BRANCH=$(git -C "$DIR" branch --show-current 2>/dev/null)
  gd=$(git -C "$DIR" rev-parse --git-dir 2>/dev/null)
  gcd=$(git -C "$DIR" rev-parse --git-common-dir 2>/dev/null)
  [ "$gd" != "$gcd" ] && IS_WT=1
  TOPNAME=$(basename "$(git -C "$DIR" rev-parse --show-toplevel 2>/dev/null)")
fi

if [ -n "$BRANCH" ]; then
  if [ "$IS_WT" = 1 ]; then bc=$'\033[31m'
  elif [ "$BRANCH" = "devel" ]; then bc=$'\033[33m'
  else bc=$'\033[32m'; fi
  segs+=("${bc}${BRANCH}${RESET}")
fi

[ -n "$TOPNAME" ] || TOPNAME=$(basename "$DIR")
[ -n "$TOPNAME" ] && segs+=($'\033[36m'"${TOPNAME}${RESET}")

[ -n "$MODEL" ] && segs+=($'\033[35m'"${MODEL}${RESET}")

if [ -n "$CTX" ]; then
  c=${CTX%%.*}
  segs+=("ctx $(pct_color "$c")${c}%${RESET}")
fi

if [ -n "$H5" ] || [ -n "$D7" ]; then
  lim=""
  [ -n "$H5" ] && { h=${H5%%.*}; lim="5h $(pct_color "$h")${h}%${RESET}"; }
  [ -n "$D7" ] && { d=${D7%%.*}; lim="${lim:+$lim ${DIM}·${RESET} }7d $(pct_color "$d")${d}%${RESET}"; }
  segs+=("$lim")
fi

# --- ticket: branch wins, fallback last commit subject ---
TICKET=$(echo "$BRANCH" | grep -oE '[A-Z]+-[0-9]+' | head -1)
if [ -z "$TICKET" ] && [ -n "$DIR" ]; then
  TICKET=$(git -C "$DIR" log -1 --format=%s 2>/dev/null | grep -oE '[A-Z]+-[0-9]+' | head -1)
fi
if [ -n "$TICKET" ]; then
  # Linear workspace slug: env override, else per-repo `git config linear.workspace`.
  WORKSPACE="${LINEAR_WORKSPACE:-$(git -C "$DIR" config --get linear.workspace 2>/dev/null)}"
  if [ -n "$WORKSPACE" ]; then
    url="https://linear.app/${WORKSPACE}/issue/${TICKET}"
    segs+=("$(printf '\033]8;;%s\033\\\033[1;34m%s\033[0m\033]8;;\033\\' "$url" "$TICKET")")
  else
    segs+=($'\033[1;34m'"${TICKET}${RESET}")
  fi
fi

# --- logged-in account ---
ACCT=$(jq -r '.oauthAccount.emailAddress // empty' "$HOME/.claude.json" 2>/dev/null)
[ -n "$ACCT" ] && segs+=("${DIM}${ACCT}${RESET}")

out=""
for s in "${segs[@]}"; do out="${out:+$out$SEP}$s"; done

# --- caveman / ponytail badges (latest installed version) ---
for p in caveman ponytail; do
  script=$(ls -d "$HOME/.claude/plugins/cache/$p/$p"/*/hooks/$p-statusline.sh 2>/dev/null | tail -1)
  [ -n "$script" ] && badge=$(bash "$script" 2>/dev/null) && [ -n "$badge" ] && out="$out $badge"
done

printf '%s' "$out"
