---
name: shopware-expertise
description: "Use when developing for Shopware 6 - app system webhooks and Admin API, Store API clients, Flow or Rule Builder automation, or Admin Extension SDK work."
---

# Shopware 6 Rules

## Apps over plugins

- **Default to the app system** (manifest.xml, webhooks, Admin API) for new extensions. Plugins run PHP inside the shop process and are **not allowed on Shopware Cloud**; apps work on both cloud and self-hosted. Reach for a plugin only when you genuinely need in-process hooks (custom DAL entities with complex logic, checkout internals) on a self-hosted target.

## Webhook signature verification — non-negotiable

Every app webhook/action request from Shopware carries an HMAC-SHA256 signature over the raw body, keyed with your app secret, in the **`shopware-shop-signature`** header. Verify BEFORE parsing:

```php
$raw = file_get_contents('php://input');
$sig = $_SERVER['HTTP_SHOPWARE_SHOP_SIGNATURE'] ?? '';
if (!hash_equals(hash_hmac('sha256', $raw, $appSecret), $sig)) {
    http_response_code(401); exit;
}
```

Registration handshake uses a different header (`shopware-app-signature` over the query string) - do not conflate the two. Skipping verification means anyone can forge order events at your endpoint.

## Admin API

- Auth: OAuth2 client-credentials (integration key/secret) against `/api/oauth/token`.
- **Batch writes go through `/api/_action/sync`**, not per-entity POST/PATCH loops: one payload of `{key: {entity, action: "upsert"|"delete", payload: [...]}}` operations, executed transactionally. Importing 500 products via 500 requests is wrong; one sync call is right.
- Entity writes are full DAL payloads - associations write in the same request (nested payloads), no separate link endpoints.

## Store API (headless clients)

- Every request needs the **`sw-access-key`** header (sales-channel access key). Session continuity (cart, login, language/currency context) rides on **`sw-context-token`**: capture it from the first response and send it back on every subsequent request, or each call gets a fresh anonymous context and your cart "disappears".

## Rule Builder vs Flow Builder — decision rule

- **Rule Builder** = declarative *conditions* evaluated in context: prices, shipping/payment availability, promotions ("cart total > 100 AND customer group B2B"). It answers "does this apply right now?"
- **Flow Builder** = event-triggered *actions*: "order placed → send mail, add tag, call webhook". It answers "something happened, do X". Flows can *use* rules as conditions; never model a reaction as a rule or an availability constraint as a flow.

## Frontend + admin UI

- Headless storefront = **Composable Frontends** (Nuxt 3-based, `@shopware/composables` + api-client). The old **Shopware PWA / Vue Storefront integration is DEAD - never recommend it.**
- Admin customization from apps = **Admin Extension SDK** (iframe/postMessage components) - apps cannot inject Vue components into the admin the way plugins do.
