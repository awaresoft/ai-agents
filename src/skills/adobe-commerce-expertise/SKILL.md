---
name: adobe-commerce-expertise
description: "Use when working on Adobe Commerce or Magento extensibility - App Builder actions, API Mesh configuration, aio CLI, I/O Events, or out-of-process customization."
---

# Adobe Commerce Extensibility Rules

## Hard rules

- **Default to out-of-process.** New customization goes into App Builder (I/O Runtime actions, API Mesh, I/O Events), not PHP modules. In-process PHP (plugins/preferences/observers) is only justified when logic must run synchronously inside a core transaction (e.g. price mutation during quote calculation). Everything else - integrations, sync, admin tooling - lives outside the monolith so SaaS/cloud upgrades don't break it.
- **Auth: OAuth Server-to-Server only.** JWT service-account credentials are deprecated and being removed. Never scaffold new `jwt` credential blocks; use `aio` project workspaces with OAuth S2S client credentials and rotate secrets via the Developer Console.
- **CLI flow:** `aio login` → `aio console org/project/workspace select` → `aio app init` (pick templates: actions, events, mesh) → `aio app run` for local dev → `aio app deploy`. `app.config.yaml` is the source of truth for actions/web config - do not hand-edit deployed manifests.

## I/O Runtime action constraints

- Web actions hard-cap at **60 seconds**; blocking invocations that exceed it return 502-style failures. Anything slower must be split: web action enqueues, non-web action processes.
- Actions are **stateless** and containers are recycled - no in-memory caches you rely on, no local filesystem persistence. Use adobe/aio-lib-state or aio-lib-files for state.
- Cold starts are real; keep bundles thin (avoid heavy SDK imports at top level), return early, and never poll inside an action.

## API Mesh

- Mesh config is a single JSON: `{"meshConfig": {"sources": [{"name", "handler": {"graphql"|"openapi"|"JsonSchema": {...}}}], "additionalResolvers": [...]}}`. Deploy with `aio api-mesh create/update mesh.json`.
- Resolvers run inside Mesh's global **60-second request timeout** (applied to all requests, not configurable) - do not put slow upstreams behind a custom resolver; the whole query fails together.
- **Decision rule:** use Mesh when you're combining Commerce GraphQL with other sources or reshaping schema for a storefront; call Commerce GraphQL directly when it's the only source - Mesh adds a hop and its own failure mode for zero benefit.

## I/O Events

- Register providers/subscriptions via Developer Console or `aio event`; Commerce-side you enable the module and subscribe events like `observer.sales_order_save_after`.
- Delivery is **at-least-once with retries** - handlers MUST be idempotent (dedupe on event id or entity version). Never assume ordering across events.
