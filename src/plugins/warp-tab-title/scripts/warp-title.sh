#!/bin/bash
# Warp tab sync: OSC 7 (cwd -> Warp branch indicator follows worktrees) + OSC 0 title (dot+ticket+branch).
# Hooks: SessionStart + UserPromptSubmit + PostToolUse(Bash|EnterWorktree|ExitWorktree).
# Emits {"terminalSequence": ...} on stdout (CC >= 2.1.141); /dev/tty is unreliable from hooks.

input=$(cat)
DIR=$(echo "$input" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$DIR" ] || exit 0
git -C "$DIR" rev-parse --git-dir >/dev/null 2>&1 || exit 0

BRANCH=$(git -C "$DIR" branch --show-current 2>/dev/null)
gd=$(git -C "$DIR" rev-parse --git-dir 2>/dev/null)
gcd=$(git -C "$DIR" rev-parse --git-common-dir 2>/dev/null)

if [ "$gd" != "$gcd" ]; then
  DOT="🔴"
  PROJECT=$(basename "$(dirname "$gcd")")
  LABEL=$(basename "$(git -C "$DIR" rev-parse --show-toplevel 2>/dev/null)")
elif [ "$BRANCH" = "devel" ]; then
  DOT="🟡"
  PROJECT="no worktree"
  LABEL="devel"
else
  DOT="🟢"
  PROJECT="no worktree"
  LABEL="$BRANCH"
fi

TICKET=$(echo "$BRANCH" | grep -oE '[A-Z]+-[0-9]+' | head -1)
[ -z "$TICKET" ] && TICKET=$(git -C "$DIR" log -1 --format=%s 2>/dev/null | grep -oE '[A-Z]+-[0-9]+' | head -1)

TITLE="$DOT $PROJECT ${TICKET:+$TICKET }$LABEL"
SEQ=$(printf '\033]7;file://%s%s\007\033]0;%s\007' "$(hostname)" "$DIR" "$TITLE")
jq -nc --arg seq "$SEQ" '{terminalSequence: $seq}'
exit 0
