---
name: shopify-hydrogen-expertise
description: "Use when building Shopify headless storefronts - Hydrogen and React Router routes, Storefront or Admin GraphQL API, Oxygen deployment, cart mutations, or metafields and metaobjects."
---

# Shopify Hydrogen Rules

**Scope: headless storefronts only.** Admin-app topics (Polaris, App Bridge, embedded apps) are Shopify app development - out of scope here.

## Framework

- Hydrogen is now built on **React Router 7**, not classic Remix. Use RR7 idioms: `loader`/`action` in route modules, `Route.LoaderArgs` typed args, `react-router` imports. Do not scaffold `@remix-run/*` imports or `remix.config.js` in new work; when upgrading an older Remix-based Hydrogen app, migrate to the RR7 template rather than patching around it.
- Server logic belongs in loaders/actions running on the server runtime; the Hydrogen context (`storefront`, `cart`, `env`, `session`) is created in `server.ts` and reached via `context` in loaders.

## Storefront API versioning

- The Storefront API versions **quarterly** (`2025-01`-style names) and old versions expire after ~12 months. **Pin an explicit version** in your client config and codegen; never rely on "unstable" or an implicit latest. Upgrades are deliberate events: bump the pinned version, re-run codegen, read the release notes for removed fields.

## Query caching (Oxygen sub-request cache)

- Every `storefront.query` takes a cache strategy: **`CacheLong()`** (1h max-age + 23h SWR) for rarely-changing data (shop metadata, nav menus), **`CacheShort()`** (1s max-age + 9s SWR) for product/collection pages where freshness matters, **`CacheNone()`** for anything personalized, cart-related, or inside mutations. Default is `CacheDefault()` (1s max-age + ~1-day SWR) - be explicit. Never cache queries carrying customer tokens.

## Cart

- Use the Hydrogen **cart handler** (`createCartHandler`) wired into context; mutate via the standard cart action route handling `CartForm` actions (`LinesAdd`, `LinesUpdate`, `LinesRemove`, `DiscountCodesUpdate`). The **cart id lives in the session cookie** - do not invent client-side cart state or persist line items in localStorage; the cart object from Shopify is the source of truth, checkout is `cart.checkoutUrl`.

## Oxygen runtime

- Oxygen is a **workers runtime, NOT Node**: no Node built-ins (`fs`, `net`, `crypto` beyond WebCrypto), no long-running processes, no background timers surviving the response. Dependencies must be worker-compatible; test with the Oxygen-targeting dev server, not `node server.js`.

## Customer data

- Authenticated customer features use the **Customer Account API** (OAuth-based, its own token flow via Hydrogen's `customerAccount` client) - not Storefront API customer access tokens, which are the legacy path. Storefront tokens are for public catalog/cart data only.

## Metafields / metaobjects

- Query metafields explicitly by `namespace`/`key` (or the `metafields(identifiers:)` list form); only metafields with a **storefront-visible definition** are exposed. Metaobjects are first-class content entries - prefer them over JSON-blob metafields for structured editorial content.
