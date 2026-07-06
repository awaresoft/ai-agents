---
name: medusa-expertise
description: "Use when working in a Medusa v2 codebase - custom modules, workflows, module links, Query API, admin widgets, or medusa-config setup."
---

# Medusa v2 Rules

**v2 only.** v1 patterns (services extending `TransactionBaseService`, `repositories/`, subscribers doing business logic, `medusa-config.js` plugin arrays) are obsolete - never suggest them, and treat their presence as migration debt.

## Module isolation — the cardinal rule

- Modules are hard-isolated: **NEVER import another module's services, models, or repos directly.** Each module only sees its own container. Cross-module anything goes through Query or links.
- Cross-module reads use **Query**: `const query = container.resolve(ContainerRegistrationKeys.QUERY)` then `query.graph({ entity: "order", fields: ["id", "items.*", "customer.email"], filters: {...} })`. Query joins across module boundaries via the link layer - it is the only sanctioned cross-module join.
- Cross-module relations are declared with **`defineLink`** in `src/links/` (e.g. link your custom `brand` to `productModule.linkable.product`), then materialized with `npx medusa db:migrate` (link tables are synced too). Without a link, Query cannot traverse the relation.

## Workflows own business logic

- Multi-step operations live in **workflows**, not in API route handlers or module services. Use `createWorkflow` / `createStep` from `@medusajs/framework/workflows-sdk`; every step with side effects gets a **compensation function** so failures roll back cleanly:

```ts
const reserveStock = createStep(
  "reserve-stock",
  async (input: { itemId: string }, { container }) => {
    const svc = container.resolve("inventoryService")
    const res = await svc.reserve(input.itemId)
    return new StepResponse(res, res.id)
  },
  async (reservationId, { container }) => {
    await container.resolve("inventoryService").release(reservationId)
  }
)
```

- Prefer composing Medusa's core workflows / hooks over reimplementing them; steps must be idempotent-ish since retries happen.

## Registration and structure

- Custom modules register in **`medusa-config.ts`** under `modules: [{ resolve: "./src/modules/brand" }]` - a module not listed there does not exist at runtime. Config uses `defineConfig` from `@medusajs/framework/utils`.
- Convention-driven layout: `src/modules/` (module + models + service), `src/links/`, `src/workflows/`, `src/api/` (file-based routes: `route.ts` exporting `GET`/`POST`), `src/jobs/`, `src/subscribers/` (thin - they should mostly trigger workflows).

## Admin customization

- Extend the dashboard from **`src/admin/`**: widgets via `defineWidgetConfig` with a `zone` (e.g. `product.details.after`), full pages as UI routes (`src/admin/routes/<path>/page.tsx`). Use `@medusajs/ui` components; never fork the admin app.
