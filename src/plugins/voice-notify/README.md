# voice-notify

Claude Code plugin: speaks session events out loud, **one voice per event class**, so you can tell what happened without looking at the terminal.

Different registers matter more than different names — a female voice, a male voice, a singing voice and a whisper are distinguishable across a room; two neutral female voices are not.

| Event | Hook | Default voice | Phrase |
| --- | --- | --- | --- |
| Turn finished | `Stop` | `Samantha` (en_US, female) | "Done." |
| Decision needed | `Notification` | `Daniel` (en_GB, male) | "Permission needed." / "Waiting for you." |
| Goal complete | `PostToolUse(TodoWrite)`, every todo `completed` | `Good News` (singing) | "All tasks complete." |

English only by design: macOS ships exactly one Polish voice (`Zosia`), so a per-event voice split is impossible in Polish.

**`SubagentStop` is supported but off.** It fires once per subagent, which with skills and parallel agents means a dozen announcements per turn — and a finished subagent almost never needs a reaction, since the `Stop` or goal event covers it moments later. Set `CC_VOICE_SUBAGENT_ENABLED=1` to bring it back, and pick something other than `Whisper` for it: a breathy voice reads as low priority but drops the words, so you hear "agent… something" and learn nothing.

It is gated in the script, not just left out of `hooks.json`, and that distinction matters. **A session caches its hook configuration at startup**, so unregistering a hook leaves every already-running session announcing until it is closed. The script is re-read on every invocation, so a switch inside it takes effect immediately across all sessions. Anything you might need to shut off in a hurry belongs in the script, not only in the registration.

## Log

Every spoken line is appended to `$TMPDIR/cc-voice/spoken.log` (override with `CC_VOICE_LOG`):

```
2026-08-07 20:48:42 SubagentStop Whisper :: Agent finished.
```

This exists because "is that voice mine or the system's?" is otherwise unanswerable, and because hook activity in one session is invisible from another — the log is global, so it catches every session at once.

## Behaviour worth knowing

**Throttle.** `Stop` fires after every turn, including one-line answers. `UserPromptSubmit` stamps the turn start; `Stop` stays silent if the turn took less than `CC_VOICE_MIN_SECONDS` (default 60). Decision, goal and subagent events ignore the throttle — they always speak.

**No double announcement.** A completed goal is followed by a `Stop` a moment later. The goal event drops a flag that the next `Stop` consumes and stays quiet for.

**Non-blocking.** `say` is backgrounded, so a hook never holds up the turn.

**Fail-open, fail-quiet.** Missing `jq`, missing voice, malformed payload → `exit 0`. A broken notification must never break the session.

## Muting

Mute is global (all sessions) and time-boxed — it expires on its own, so you can never leave it off by accident.

| Slash command | Shell | Effect |
| --- | --- | --- |
| `/voice-mute` | `voice-notify.sh mute` | Silence for 1h |
| `/voice-mute 30m` | `voice-notify.sh mute 30m` | `1h`, `30m`, `90s`; a bare number means minutes |
| `/voice-unmute` | `voice-notify.sh unmute` | Back on now |
| `/voice-status` | `voice-notify.sh status` | `active`, or how much mute is left |

While muted the hooks still run — the turn timer keeps stamping, so the throttle behaves sanely the moment you unmute.

Slash commands live in `commands/` and are symlinked into `~/.claude/commands/`. For the shell, alias it:

```bash
alias voice='bash /Users/bartek/Projects/ai-agents/src/plugins/voice-notify/scripts/voice-notify.sh'
```

## Configuration

Environment variables, read at hook time:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CC_VOICE_ENABLED` | `1` | `0` = silence everything |
| `CC_VOICE_MIN_SECONDS` | `60` | Turn shorter than this → `Stop` says nothing |
| `CC_VOICE_STOP` | `Samantha` | Turn-finished voice |
| `CC_VOICE_DECISION` | `Daniel` | Decision-needed voice |
| `CC_VOICE_GOAL` | `Good News` | Goal-complete voice |
| `CC_VOICE_SUBAGENT` | `Whisper` | Subagent-finished voice |
| `CC_VOICE_RATE` | `190` | Words per minute |

Pick different voices from `say -v '?'`. Distinct-sounding installed options: `Samantha`, `Daniel`, `Karen` (en_AU), `Moira` (en_IE), `Tessa` (en_ZA), `Fred`, `Ralph`, `Whisper`, `Zarvox`, `Bells`, `Jester`, `Good News`, `Bad News`.

## Install

Requires macOS (`say`) and `jq`.

Local marketplace pointing at `src/plugins/`, or wire the four scripts directly into `~/.claude/settings.json` hooks (`UserPromptSubmit`, `Stop`, `SubagentStop`, `Notification`, `PostToolUse` matcher `TodoWrite`, `SessionEnd`). Do not run both at once — every event would be spoken twice.

If `~/.claude/settings.json` already has an `osascript` notification on `Stop`, drop it or you get a Ping and a voice for the same event.

## Checking it

```bash
bash scripts/voice-notify.sh demo      # plays all four voices in order
bash scripts/voice-notify.sh selftest  # dry-run assertions on the branching, no audio
```
