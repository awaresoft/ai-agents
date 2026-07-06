---
name: commercetools-expertise
description: "Use when building on commercetools - TypeScript SDK usage, API Extensions vs Subscriptions, Custom Types and Fields, cart discounts, or order state modeling."
---

# commercetools Rules

## SDK

- Use **`@commercetools/ts-client` + `@commercetools/platform-sdk`** (ClientBuilder from ts-client, typed `apiRoot` from platform-sdk). The older **`@commercetools/sdk-client-v2` is DEPRECATED - never recommend or scaffold it**, and migrate it away when found. Build: `new ClientBuilder().withProjectKey(...).withClientCredentialsFlow(...).withHttpMiddleware(...).build()`, then `createApiBuilderFromCtpClient(client).withProjectKey({projectKey})`.

## API Extensions vs Subscriptions — the decision rule

- **API Extensions** run synchronously inside the commerce operation and share its hard **~2 second** timeout budget. Put ONLY lightweight validation/enrichment there (reject invalid cart, stamp a computed custom field). If your handler does network hops, external pricing, or anything that can be slow, it will time out and fail customer checkouts.
- **Everything heavy goes to Subscriptions**: async delivery (SQS/PubSub/EventGrid/etc.), **at-least-once** semantics - handlers MUST be idempotent (dedupe on `resource.id` + `version` or message `sequenceNumber`) and tolerate out-of-order messages.

## Optimistic concurrency

- Every update MUST send the resource's current `version`. On **409 ConcurrentModification**: refetch, re-apply your update actions against the fresh version, retry (bounded retries with jitter). Never blindly bump the version number and never disable the check by looping until success without re-reading.

## Update actions, not documents

- commercetools has no whole-resource PUT. All mutations are `POST` with `{version, actions: [...]}` - e.g. `{action: "setCustomField", name, value}`. Compose minimal action lists; each action is validated individually, and one invalid action rejects the whole request.

## Data modeling

- Extend standard resources with **Types + Custom Fields** (`custom: {type: {key}, fields}`) - typed, queryable, indexed. Use **Custom Objects** (container/key JSON) only for data that belongs to no resource; note the documented limits (max **20 000 000 Custom Objects per Project**; each shares the general **16 MB JSON document cap**, with ~100 KB average recommended) - do not stuff catalogs or logs into them.
- Cart discounts: predicate-based `cartPredicate`/`lineItemPredicate` strings evaluated server-side; `sortOrder` (unique decimal string between 0 and 1) controls stacking - collisions are rejected.

## Order/line-item flows

- Model fulfillment/return flows with the **State machine resource** (`states` with `type: OrderState`/`LineItemState` and explicit `transitions`), moved via `transitionState` / `transitionLineItemState` actions - not with ad-hoc custom fields pretending to be a status enum.
