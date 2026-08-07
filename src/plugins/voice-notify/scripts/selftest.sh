#!/bin/bash
# Dry-run assertions for voice-notify.sh branching. No audio, no real state dir.
# Payloads live in a variable first: \" inside $( ) loses its quoting and the
# JSON braces turn into a brace expansion.
SUT="${1:-$(dirname "$0")/voice-notify.sh}"
export CC_VOICE_DRY=1
export CC_VOICE_STATE_DIR
CC_VOICE_STATE_DIR=$(mktemp -d)
trap 'rm -rf "$CC_VOICE_STATE_DIR"' EXIT

fail=0
check() {
  local name=$1 expected=$2 got=$3
  if [ "$got" = "$expected" ]; then
    echo "ok   $name"
  else
    echo "FAIL $name: expected '$expected', got '$got'"
    fail=1
  fi
}
run() { echo "$1" | bash "$SUT"; }

p='{"session_id":"t1","hook_event_name":"Notification","message":"Claude needs your permission to use Bash"}'
check "notification/permission" "Daniel|Permission needed." "$(run "$p")"

p='{"session_id":"t1","hook_event_name":"Notification","message":"Claude is waiting for your input"}'
check "notification/idle" "Daniel|Waiting for you." "$(run "$p")"

sa='{"session_id":"t1","hook_event_name":"SubagentStop"}'
check "subagent/off by default" "" "$(run "$sa")"
check "subagent/opt-in speaks" "Whisper|Agent finished." "$(CC_VOICE_SUBAGENT_ENABLED=1 run "$sa")"

p='{"session_id":"t1","hook_event_name":"PostToolUse","tool_name":"TodoWrite","tool_input":{"todos":[{"status":"completed"},{"status":"in_progress"}]}}'
check "todo/partial silent" "" "$(run "$p")"

p='{"session_id":"t1","hook_event_name":"PostToolUse","tool_name":"TodoWrite","tool_input":{"todos":[]}}'
check "todo/empty silent" "" "$(run "$p")"

p='{"session_id":"t1","hook_event_name":"PostToolUse","tool_name":"Bash"}'
check "other tool silent" "" "$(run "$p")"

prompt='{"session_id":"t1","hook_event_name":"UserPromptSubmit"}'
stop='{"session_id":"t1","hook_event_name":"Stop"}'

# Fresh turn -> Stop under the throttle stays silent.
run "$prompt" >/dev/null
check "stop/throttled" "" "$(CC_VOICE_MIN_SECONDS=60 run "$stop")"

# Same, but the turn counts as long.
run "$prompt" >/dev/null
check "stop/long turn" "Samantha|Done." "$(CC_VOICE_MIN_SECONDS=0 run "$stop")"

# No turn_start at all -> fail open.
check "stop/no timestamp" "Samantha|Done." "$(run "$stop")"

# Goal announcement swallows the Stop right after it.
p='{"session_id":"t1","hook_event_name":"PostToolUse","tool_name":"TodoWrite","tool_input":{"todos":[{"status":"completed"},{"status":"completed"}]}}'
check "goal/all done" "Good News|All tasks complete." "$(run "$p")"
check "stop/after goal silent" "" "$(CC_VOICE_MIN_SECONDS=0 run "$stop")"
check "stop/next turn speaks again" "Samantha|Done." "$(CC_VOICE_MIN_SECONDS=0 run "$stop")"

check "kill switch" "" "$(CC_VOICE_ENABLED=0 run "$stop")"

p='{"session_id":"t1","hook_event_name":"SessionEnd"}'
run "$p" >/dev/null
check "session end wipes state" "absent" "$([ -d "$CC_VOICE_STATE_DIR/t1" ] && echo present || echo absent)"

check "garbage input" "" "$(run 'not json')"

# --- mute ---
sub() { bash "$SUT" "$@"; }

check "status/active" "active" "$(sub status)"

# Wall clock moves between `mute` and `status`, so assert the shape and a
# bounded delta, never an exact countdown string.
check_duration() {
  local arg=$1 want=$2 until now delta
  sub mute "$arg" >/dev/null
  until=$(cat "$CC_VOICE_STATE_DIR/muted_until")
  now=$(date +%s)
  delta=$((until - now))
  if [ "$delta" -le "$want" ] && [ "$delta" -ge $((want - 5)) ]; then
    echo "ok   duration/$arg"
  else
    echo "FAIL duration/$arg: expected ~${want}s, got ${delta}s"
    fail=1
  fi
}

sub mute 2m >/dev/null
case "$(sub status)" in
  "muted, "*"m"*"s left") echo "ok   status/muted" ;;
  *) echo "FAIL status/muted: got '$(sub status)'"; fail=1 ;;
esac
check "muted/stop silent" "" "$(CC_VOICE_MIN_SECONDS=0 run "$stop")"
check "muted/subagent silent" "" "$(CC_VOICE_SUBAGENT_ENABLED=1 run "$sa")"

# Turn timer still runs while muted, so the throttle is sane after unmute.
run "$prompt" >/dev/null
check "muted/timer still stamped" "present" \
  "$([ -f "$CC_VOICE_STATE_DIR/t1/turn_start" ] && echo present || echo absent)"

sub unmute >/dev/null
check "status/after unmute" "active" "$(sub status)"
check "unmuted/speaks again" "Samantha|Done." "$(CC_VOICE_MIN_SECONDS=0 run "$stop")"

check_duration 90s 90
check_duration 1h 3600
check_duration 45 2700
sub unmute >/dev/null

sub mute abc >/dev/null 2>&1
check "duration/invalid rejected" "1|active" "$?|$(sub status)"

# Expired mute must not stick.
mkdir -p "$CC_VOICE_STATE_DIR" && echo 1 >"$CC_VOICE_STATE_DIR/muted_until"
check "mute/expired ignored" "active" "$(sub status)"
check "mute/expired speaks" "Samantha|Done." "$(CC_VOICE_MIN_SECONDS=0 run "$stop")"

exit $fail
