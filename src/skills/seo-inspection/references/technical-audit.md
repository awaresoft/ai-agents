# Technical SEO Audit

Every item below is a check with a pass/fail condition. Map page types and templates first, then run checks per template, not per page.

## Crawl and indexation

- robots.txt: fetch it, confirm no `Disallow` covers priority sections and that the sitemap is declared.
- XML sitemaps contain only canonical, indexable, 200-status URLs and reflect real site structure. Spot-check entries with `curl -sI <url>`.
- Check the `x-robots-tag` **response header**, not just the meta tag: `curl -sI <url> | grep -i x-robots-tag`. A header-level `noindex` silently overrides anything in the HTML.
- Redirect chains: max 1 hop. `curl -sIL <url>` and count 3xx responses; 2+ hops waste crawl budget and dilute signals — flatten to a single 301.
- Faceted-navigation index bloat: run `site:domain.com inurl:<param>` for each filter/sort parameter. Thousands of indexed filtered URLs = bloat; fix with canonicals, robots rules, or parameter removal.

## Canonicals — one signal per URL

- Canonical target must itself be a 200, indexable, self-canonical page.
- Conflict rule: a URL must send exactly one indexing signal. Flag as broken: canonical pointing to a redirecting URL, `canonical` + `noindex` on the same page (Google ignores the canonical), redirected URLs listed in the sitemap, canonical loops.

## Rendering

- Rendered-vs-raw diff: fetch raw HTML with `curl -s <url>`, compare against the rendered DOM in DevTools (`document.documentElement.outerHTML`). Content or links present only in the rendered DOM = JS-rendering risk; confirm indexability with GSC URL Inspection's rendered HTML.
- Cloaking / bot-blocking: `curl -s -A "Googlebot" <url>` vs a normal user agent. Different status code or materially different content means bot handling that must be fixed.
- Mobile parity: mobile rendered HTML must contain the same primary content and internal links as desktop (mobile-first indexing).

## Structured data

- Schema must match visible page content and include all required properties for the target rich result. Validate with the Rich Results Test; a parse-clean schema that describes content not on the page is a violation, not a win.

## Core Web Vitals

- Thresholds at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- Field vs lab: CrUX (field data) is what ranking uses — treat it as truth. Lighthouse is a lab diagnostic for finding causes. A green Lighthouse score with failing CrUX is still failing.
