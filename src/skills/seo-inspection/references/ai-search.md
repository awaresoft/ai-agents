# AI Search Optimization (GEO)

Goal: raise the probability that answer engines (AI Overviews, ChatGPT search, Perplexity, Claude) retrieve, quote, and cite the site. This domain moves fast — verify crawler names and engine behavior against current documentation when stakes are high.

## Answer-block pattern

- Each key page opens its main section with a question-phrased H2 followed immediately by a direct 40-80 word answer, then expands with detail. Engines extract the block; the depth below it earns the citation.
- Definitions, steps, and comparisons belong in semantic structures (lists, tables, `<dl>`), not prose paragraphs — retrieval systems identify them by shape.

## AI crawler access

| User-agent | Operator | Purpose |
| --- | --- | --- |
| GPTBot | OpenAI | model training |
| OAI-SearchBot | OpenAI | ChatGPT search citations |
| ClaudeBot | Anthropic | model training |
| Claude-SearchBot | Anthropic | Claude search citations |
| PerplexityBot | Perplexity | answer citations |
| Google-Extended | Google | Gemini training |

Robots.txt policy is a **decision, not a default**: blocking training bots (GPTBot, ClaudeBot, Google-Extended) is a legal/brand choice; blocking search bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot) removes you from citations and referral traffic. Note: Google-Extended does NOT affect Google Search or AI Overviews — those use regular Googlebot. Check the live robots.txt with `curl -s domain.com/robots.txt` and confirm no search-citation bot is blocked by accident (e.g. a blanket `Disallow: /` for unknown agents).

## llms.txt

- Emerging convention (markdown index of key content at `/llms.txt`). Adoption is low and no major engine has confirmed consuming it — offer it as a cheap, low-risk addition; don't oversell it as a ranking lever.

## Entity clarity

- `Organization` and `Person` schema with `sameAs` links to Wikipedia/Wikidata, LinkedIn, GitHub, and other authoritative profiles. Same canonical name for the brand, products, and authors on every page — inconsistent naming fragments the entity.

## Citation magnets

- Original data (benchmarks, surveys, real numbers) and named expert quotes are what engines cite when every competitor has the same generic explanation. One page with unique data outperforms ten paraphrase pages.

## Verify actual visibility

- Don't guess: actually query ChatGPT, Perplexity, and Google AI Overviews with the buying/how-to questions that matter. Record whether the brand is mentioned, whether the site is cited, and which competitors are cited instead — that list is the gap analysis.
