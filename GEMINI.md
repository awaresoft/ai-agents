# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Directory Overview

This repository stores Claude agents, OpenCode agents, Codex agents, and shared skills for different engineering and content purposes. Each agent is a specialized expert designed to handle specific domains and tasks.

## Key Directories and Files

### 🤖 Agent Definitions
- **`.claude/agents/`**: Core definitions for Claude.
  - `backend-architect.md`, `backend-engineer.md`, `content-writer.md`, `devops-engineer.md`, `e2e-test-engineer.md`, `frontend-architect.md`, `frontend-engineer.md`, `principal-engineer.md`, `secops-auditor.md`, `seo-inspector.md`, `staff-engineer.md`, `team-manager.md`, `ux-ui-architect.md`.
- **`.config/opencode/agents/`**: Definitions for OpenCode.
  - `backend-architect.md`, `backend-engineer.md`, `content-writer.md`, `devops-engineer.md`, `e2e-test-engineer.md`, `frontend-architect.md`, `frontend-engineer.md`, `secops-auditor.md`, `seo-inspector.md`, `ux-ui-architect.md`.
- **`.codex/agents/`**: Definitions for Codex.
  - `content-writer.md`, `seo-inspector.md`.

### 🛠️ Skill Definitions
- **`.claude/skills/`**: Specialized skills for Claude including `code-review`, `tech-arch-research`, the SEO skill set, and the new writing skills `technical-blog-writing`, `attention-retention-writing`, and `blog-editorial-strategy`.
- **`.config/opencode/skills/`**: Specialized skills for OpenCode including the same SEO and writing skill sets.
- **`.codex/skills/`**: Codex-compatible skill definitions including `code-review`, `tech-arch-research`, the SEO skill set, and the new writing skills `technical-blog-writing`, `attention-retention-writing`, and `blog-editorial-strategy`.

### 📘 Core Documentation
- **`AGENTS.md`**: Central directory and guidelines for all agents and skills.
- **`CLAUDE.md`**: Claude-specific instructions and agent listings.
- **`README.md`**: Main repository introduction.

## Usage

The contents of this directory are used to configure and provision AI agents. When creating or modifying agents, follow the established format (YAML frontmatter + structured sections) and guidelines outlined in `AGENTS.md`.

The new `content-writer` agent is the default specialist for technical blog writing, editorial planning, and attention-aware content refinement. Pair it with `technical-blog-writing`, `attention-retention-writing`, and `blog-editorial-strategy` when working on blog or thought-leadership content.
