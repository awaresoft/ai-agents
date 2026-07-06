---
name: react
description: "Use when writing or reviewing React components or hooks - re-render and memoization questions, state placement, Suspense and error boundaries, forms, or React Testing Library tests. For Next.js routing/caching use next-js; for mobile use react-native."
---

# React

Base skill for the React family. The `next-js` and `react-native` skills assume everything here and add only platform deltas.

## House Rules

- **Server state goes through TanStack Query.** Never `useEffect` + `fetch` + `setState` — that pattern re-invents caching, races, and retries badly. Query keys mirror the API resource; mutations invalidate them.
- **Forms are react-hook-form + `zodResolver`.** One module-level Zod schema per form. No per-field `useState` validation, no HTML5 validation attributes.
- **Derived state is computed during render.** If a value can be calculated from props/state, calculate it inline (or in `useMemo` when provably hot). Mirroring it via `useEffect` + `setState` causes double renders and stale frames.
- **Memoization:** if the React Compiler is enabled, write plain code — no manual `useMemo`/`useCallback`/`React.memo`. Without the compiler, memoize only after the Profiler shows a real cost. Speculative memoization is noise.
- **State placement ladder:** local → lifted to nearest common parent → URL (filters, tabs, pagination) → global store. Reach for a global store last; most "global" state is actually server state (see rule 1) or URL state.
- **Error and Suspense boundaries per route/feature**, not one app-wide catch-all. A failed widget should not blank the page.
- **RTL tests query by role/label** (`getByRole`, `getByLabelText`) and assert user-visible behavior — never class names, state internals, or `data-testid` as first resort.
- **Keys derive from data identity** (id, slug). Never array index for lists that reorder, filter, or insert.
