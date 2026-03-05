# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository stores Claude and OpenCode agents for different engineering purposes. Each agent is a specialized expert designed to handle specific software engineering domains and tasks.

## Agent Structure

All agents are stored in `.claude/agents/` (for Claude) and `.config/opencode/agents/` (for OpenCode) as markdown files with YAML frontmatter containing:
- `name`: Agent identifier
- `description`: When and how to use the agent with examples
- `model`: Claude model to use (typically sonnet)
- `color`: UI color for the agent

## Available Claude Agents

- **backend-architect.md**: DDD, Microservices design, and architectural guidance.
- **backend-engineer.md**: Implementation of services, APIs, and domain logic.
- **devops-engineer.md**: Infrastructure as Code, CI/CD, and orchestration.
- **e2e-test-engineer.md**: Playwright E2E testing and QA.
- **frontend-architect.md**: High-level technical strategy for web apps.
- **frontend-engineer.md**: UI/UX implementation and frontend testing.
- **principal-engineer.md**: Strategic technical leadership and reviews.
- **secops-auditor.md**: Security architecture and threat analysis.
- **staff-engineer.md**: Cross-team coordination and strategic planning.
- **team-manager.md**: People management and project delivery.
- **ux-ui-architect.md**: High-performance, accessible interface architecture.

## Available Claude Skills

- **code-review**: Specialized skill for comprehensive code analysis.
- **tech-arch-research**: Research-driven technical architecture analysis.

## Agent Development Guidelines

When creating or modifying agents:
- Follow the established YAML frontmatter format.
- Include clear descriptions with practical usage examples.
- Define specific expertise areas and responsibilities.
- Maintain consistent communication style and quality standards.
- Include quality controls and self-verification steps for complex agents.
