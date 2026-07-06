---
name: next-js
description: "Use when building, reviewing, or debugging a Next.js App Router app - Server and Client Components, Server Actions, caching and revalidation, middleware/proxy, or edge versus node runtime issues."
---

# Next.js (App Router)

The `react` skill applies in full — this file is App Router deltas only.

## Version Gotchas (Next 15+)

- **`fetch()` is NOT cached by default anymore.** Pre-15 advice about implicit caching is wrong; opt in with `cache: 'force-cache'` or segment-level `revalidate`.
- **`params` and `searchParams` are async** — `await` them in pages, layouts, and route handlers. Sync access is a deprecation-then-break.
- **`middleware.ts` is renamed `proxy.ts` in Next 16.** Check which the repo uses before editing.

## House Rules

- **Server Components by default.** Add `'use client'` only at interactive leaves — never on layouts or whole pages "to be safe". Each directive pulls its subtree into the client bundle.
- **Server Actions are public HTTP endpoints.** Every action validates input with Zod and checks auth inside the action body — proximity to a component grants zero protection. After a successful mutation, call `revalidatePath`/`revalidateTag`.
- **Rendering decision ladder:** static by default → time-based freshness needs `export const revalidate` → per-request data uses dynamic APIs (`cookies()`, `headers()`) → `export const dynamic = 'force-dynamic'` only as a last resort, never as a debugging shortcut.
- **Edge runtime has no Node built-ins** (`fs`, `net`, most of `crypto`). Set `export const runtime` explicitly wherever it matters instead of relying on inference.
- **Read the repo's `next.config` before advising on caching.** Behavior differs by version and flags (PPR, cacheComponents, staleTimes) — never answer from generic memory.
