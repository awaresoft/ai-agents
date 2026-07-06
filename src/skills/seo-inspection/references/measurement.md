# SEO Measurement and Observability

## Google Search Console — API gotchas

- 16-month data retention: anything older is gone. Set up a scheduled export (API to warehouse) before you need year-over-year history.
- ~3-day data lag: never alert on the last 2-3 days; they will always look like a drop.
- Long-tail queries are sampled/privacy-filtered: summing the query dimension undercounts true totals. Use the page dimension for totals, the query dimension for exploration only.

## Dashboards

- Segment by page type and intent (e.g. `/blog/`, `/product/`, `/docs/`), never sitewide averages — a template-level failure disappears inside a sitewide number.
- Distinguish diagnostics (crawl stats, indexed count, CWV) from business KPIs (clicks, conversions). Report both, don't mix them in one chart.
- Leading indicators: impressions, crawl stats, indexation count. Lagging: clicks, conversions. A drop shows up in leading metrics first — alert there.

## Alerting

- Baseline example: week-over-week impressions down 20% **per page-type segment** (not sitewide). Also alert on: indexed-page count drop, crawl-error spike, structured-data error spike, CWV segment turning red.
- Every alert needs an owner and a first-response runbook line, or it becomes noise.

## Field CWV

- CrUX is the ranking-relevant field data: query it via the CrUX API or BigQuery (`chrome-ux-report` public dataset) per origin or URL. Lighthouse/Lab belongs in CI as a regression guard, not in KPI reporting.

## SEO experiments

- User-level A/B testing does not work for SEO: crawlers are not in your experiment groups and rankings are per-URL, not per-user.
- Correct design: split comparable page groups (same template, similar traffic) into control and variant sets, apply the change to the variant group only, then compare the variant group's actual traffic against its forecast from the control group (e.g. CausalImpact). Minimum a few weeks; index lag delays effects.

## AI citation monitoring

- No GSC equivalent exists — build it: a scheduled script queries AI engines (ChatGPT, Perplexity, Claude) with a fixed question set relevant to the brand, logs brand-mention and citation rate per run, and trends it over time. Track referral traffic from AI user agents/referrers in analytics as the lagging counterpart.
