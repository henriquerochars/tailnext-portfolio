# Repository map

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

`app/` owns layout, page and theme provider. `components/` owns the existing portfolio UI. `styles/` contains Tailwind and CSS declarations; `public/` contains real portfolio assets. `tests/e2e/` owns user behavior verification.

`scripts/agent/` contains portable built-in Node harness code; `scripts/agent-hooks/` contains offline advisory adapters. `config/harness/` is the reviewed command/gate registry. `.agents/skills/` contains five lifecycle skills. `.github/workflows/ci.yml` is generated from the shared contract. `vercel.json` preserves ordinary Next build and existing Git deployment integration.

No database, backend service, CMS, board or AI product feature is configured.
