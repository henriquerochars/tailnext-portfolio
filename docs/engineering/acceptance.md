# Typed acceptance

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

Use exactly one `## Done when` issue section containing unchecked or checked `run:`, `check:` and `human:` criteria.

```md
## Done when
- [ ] run: yarn test:harness
- [ ] run: node scripts/agent/docs-check.mjs
- [ ] check: required-summary
- [ ] human: Independent exact-revision review and documented limitations accepted.
```

`run:` text must exactly match `config/harness/acceptance-commands.json`; fixed argv runs with shell disabled. `check:` must name a reviewed gate or `required-summary` and requires current external check evidence. `human:` is always pending in automation, even when an issue checkbox is checked. Unknown commands, shell injection, duplicate/malformed sections and stale revisions fail. Acceptance execution requires current verification; issue text cannot supply executables or permissions.
