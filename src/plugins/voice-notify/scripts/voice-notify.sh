#!/bin/bash
# Spoken Claude Code notifications, one voice per event class.
# Hooks: UserPromptSubmit (turn timer), Stop, SubagentStop, Notification,
#        PostToolUse(TodoWrite) (goal), SessionEnd (state cleanup).
# Subcommands: mute [1h|30m|90s], unmute, status, demo, selftest.

[ "${CC_VOICE_ENABLED:-1}" = "0" ] && exit 0

V_STOP="${CC_VOICE_STOP:-Samantha}"
V_DECISION="${CC_VOICE_DECISION:-Daniel}"
V_GOAL="${CC_VOICE_GOAL:-Good News}"
V_SUBAGENT="${CC_VOICE_SUBAGENT:-Whisper}"
RATE="${CC_VOICE_RATE:-190}"
MIN="${CC_VOICE_MIN_SECONDS:-60}"

speak() {
  # Always logged: the only way to tell a stray system voice from one of ours.
  mkdir -p "$STATE_ROOT" 2>/dev/null && echo "$(date '+%F %T') $event $1 :: $2" >>"${CC_VOICE_LOG:-$STATE_ROOT/spoken.log}"
  # Muted: still run the hook (turn timer, cleanup), just stay silent.
  mute_remaining >/dev/null && return
  if [ "${CC_VOICE_DRY:-0}" = "1" ]; then
    echo "$1|$2"
    return
  fi
  say -v "$1" -r "$RATE" "$2" >/dev/null 2>&1 &
}

STATE_ROOT="${CC_VOICE_STATE_DIR:-${TMPDIR:-/tmp}/cc-voice}"
MUTE_FILE="$STATE_ROOT/muted_until"

# "1h" / "30m" / "90s" / bare number = minutes. Prints seconds, or fails.
parse_duration() {
  local n=${1%[hms]} u=${1#"${1%[hms]}"}
  case "$n" in '' | *[!0-9]*) return 1 ;; esac
  case "$u" in
    h) echo $((n * 3600)) ;;
    s) echo $((n)) ;;
    m | '') echo $((n * 60)) ;;
    *) return 1 ;;
  esac
}

mute_remaining() {
  local until now
  until=$(cat "$MUTE_FILE" 2>/dev/null) || return 1
  case "$until" in '' | *[!0-9]*) return 1 ;; esac
  now=$(date +%s)
  [ "$until" -gt "$now" ] || return 1
  echo $((until - now))
}

case "$1" in
  "" | -h | --help | help)
    # No args from a terminal = a human looking for the usage. No args with a
    # piped payload = a hook; fall through to the event handling below.
    if [ -t 0 ] || [ -n "$1" ]; then
      cat <<'USAGE'
voice-notify — spoken Claude Code notifications

  mute [1h|30m|90s]   silence everything for a while (bare number = minutes, default 1h)
  unmute              turn it back on
  status              active, or how much mute is left
  demo                play all four voices
  selftest            dry-run assertions, no audio

Slash commands: /voice-mute, /voice-unmute, /voice-status
USAGE
      exit 0
    fi
    ;;
  mute)
    secs=$(parse_duration "${2:-1h}") || {
      echo "usage: voice-notify.sh mute [1h|30m|90s]  (bare number = minutes)" >&2
      exit 1
    }
    until=$(($(date +%s) + secs))
    mkdir -p "$STATE_ROOT" && echo "$until" >"$MUTE_FILE"
    printf 'voice muted for %dm%02ds (until %s)\n' $((secs / 60)) $((secs % 60)) "$(date -r "$until" '+%H:%M:%S')"
    exit 0
    ;;
  unmute)
    rm -f "$MUTE_FILE"
    echo "voice unmuted"
    exit 0
    ;;
  status)
    if left=$(mute_remaining); then
      printf 'muted, %dm%02ds left\n' $((left / 60)) $((left % 60))
    else
      echo "active"
    fi
    exit 0
    ;;
  demo)
    CC_VOICE_DRY=0
    say -v "$V_STOP" -r "$RATE" "Done."
    say -v "$V_DECISION" -r "$RATE" "Permission needed."
    say -v "$V_GOAL" -r "$RATE" "All tasks complete."
    say -v "$V_SUBAGENT" -r "$RATE" "Agent finished."
    exit 0
    ;;
  selftest)
    exec "$(dirname "$0")/selftest.sh" "$0"
    ;;
esac

command -v jq >/dev/null 2>&1 || exit 0
[ "${CC_VOICE_DRY:-0}" = "1" ] || command -v say >/dev/null 2>&1 || exit 0

input=$(cat)
event=$(jq -r '.hook_event_name // empty' <<<"$input" 2>/dev/null) || exit 0
sid=$(jq -r '.session_id // "unknown"' <<<"$input" 2>/dev/null)
dir="$STATE_ROOT/$sid"

case "$event" in
  UserPromptSubmit)
    mkdir -p "$dir" && date +%s >"$dir/turn_start"
    ;;

  Notification)
    # Two real cases behind one hook: a tool wants approval, or Claude went idle.
    if jq -er '.message // ""' <<<"$input" 2>/dev/null | grep -qi 'waiting'; then
      speak "$V_DECISION" "Waiting for you."
    else
      speak "$V_DECISION" "Permission needed."
    fi
    ;;

  PostToolUse)
    [ "$(jq -r '.tool_name // empty' <<<"$input")" = "TodoWrite" ] || exit 0
    if jq -e '(.tool_input.todos // []) | length > 0 and all(.[]; .status == "completed")' <<<"$input" >/dev/null 2>&1; then
      mkdir -p "$dir" && : >"$dir/goal_done"
      speak "$V_GOAL" "All tasks complete."
    fi
    ;;

  SubagentStop)
    # Off by default: fires once per subagent, so skills and parallel agents turn
    # it into a dozen announcements a turn. Gated here rather than only in
    # hooks.json — a session caches its hook config at startup, so unregistering
    # leaves already-running sessions announcing. The script is re-read every
    # invocation, so this switch bites immediately, everywhere.
    [ "${CC_VOICE_SUBAGENT_ENABLED:-0}" = "1" ] || exit 0
    speak "$V_SUBAGENT" "Agent finished."
    ;;

  Stop)
    # Goal already announced this turn — don't say it twice.
    if [ -f "$dir/goal_done" ]; then
      rm -f "$dir/goal_done" "$dir/turn_start"
      exit 0
    fi
    started=$(cat "$dir/turn_start" 2>/dev/null)
    rm -f "$dir/turn_start"
    # No timestamp = fail open and speak.
    if [ -n "$started" ] && [ $(($(date +%s) - started)) -lt "$MIN" ]; then
      exit 0
    fi
    speak "$V_STOP" "Done."
    ;;

  SessionEnd)
    [ -n "$sid" ] && [ "$sid" != "unknown" ] && rm -rf "$dir"
    ;;
esac

exit 0
