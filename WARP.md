# WARP.md

This file provides guidance to Warp when working with code and agent definitions in this repository.

## Repository Purpose

This repository stores Claude, OpenCode, and Codex agents plus shared skills for engineering, SEO, and technical content work.

## Key Agent Directories

- `.claude/agents/` - Claude agent definitions
- `.config/opencode/agents/` - OpenCode agent definitions
- `.codex/agents/` - Codex agent definitions

## Key Skill Directories

- `.claude/skills/` - Claude skill definitions
- `.config/opencode/skills/` - OpenCode skill definitions
- `.codex/skills/` - Codex skill definitions

## Notable Agent Coverage

- Engineering agents cover backend, frontend, DevOps, E2E, UX/UI, security, and architecture roles.
- `seo-inspector` handles SEO, discoverability, content architecture, and AI-search readiness.
- `content-writer` handles technical blog strategy and writing with strong hooks, attention retention techniques, SEO awareness, and conversion-minded editorial execution.

## Notable Skill Coverage

- SEO skills include `seo-inspection`, `technical-seo-audit`, `seo-content-strategy`, `ai-search-optimization`, and `seo-measurement-observability`.
- Writing skills include `technical-blog-writing`, `attention-retention-writing`, and `blog-editorial-strategy`.

## Usage Guidance

When working on blog or thought-leadership content, use `content-writer` as the primary specialist and combine it with:
- `technical-blog-writing` for structure, clarity, examples, and credibility
- `attention-retention-writing` for hooks, pacing, and transitions
- `blog-editorial-strategy` for audience targeting, positioning, and content planning

When creating or modifying agents and skills, follow the conventions documented in `AGENTS.md`.
