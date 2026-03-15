#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$script_dir"
dry_run=false
delete_extra=false
selected_platforms=()

usage() {
  cat <<'EOF'
Usage: ./sync-local-agents.sh [--dry-run] [--delete] [--platform claude|opencode|codex]

Copies agents and skills from this repository into the matching local config
directories in your home folder.

Options:
  --dry-run   Preview changes without writing files
  --delete    Remove local files that no longer exist in this repo

Examples:
  ./sync-local-agents.sh
  ./sync-local-agents.sh --dry-run
  ./sync-local-agents.sh --delete
  ./sync-local-agents.sh --platform opencode
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=true
      ;;
    --delete)
      delete_extra=true
      ;;
    --platform)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --platform" >&2
        exit 1
      fi
      selected_platforms+=("$2")
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but not installed." >&2
  exit 1
fi

if [[ ${#selected_platforms[@]} -eq 0 ]]; then
  selected_platforms=(claude opencode codex)
fi

run_rsync() {
  local source_dir="$1"
  local target_dir="$2"

  mkdir -p "$target_dir"

  local args=(-a "$source_dir/" "$target_dir/")
  if [[ "$delete_extra" == true ]]; then
    args=(--delete "${args[@]}")
  fi
  if [[ "$dry_run" == true ]]; then
    args=(--dry-run -av "${args[@]}")
  fi

  rsync "${args[@]}"
}

sync_platform() {
  local platform="$1"
  local source_base=""
  local target_base=""

  case "$platform" in
    claude)
      source_base="$repo_root/.claude"
      target_base="$HOME/.claude"
      ;;
    opencode)
      source_base="$repo_root/.config/opencode"
      target_base="$HOME/.config/opencode"
      ;;
    codex)
      source_base="$repo_root/.codex"
      target_base="$HOME/.codex"
      ;;
    *)
      echo "Unsupported platform: $platform" >&2
      exit 1
      ;;
  esac

  if [[ ! -d "$source_base/agents" && ! -d "$source_base/skills" ]]; then
    echo "Skipping $platform: no agents or skills found in $source_base" >&2
    return
  fi

  echo "Syncing $platform"

  if [[ -d "$source_base/agents" ]]; then
    run_rsync "$source_base/agents" "$target_base/agents"
  fi

  if [[ -d "$source_base/skills" ]]; then
    run_rsync "$source_base/skills" "$target_base/skills"
  fi
}

for platform in "${selected_platforms[@]}"; do
  sync_platform "$platform"
done
