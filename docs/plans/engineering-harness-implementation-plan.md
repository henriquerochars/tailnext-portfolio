# Portfolio harness — single-PR implementation plan

Status: Proposed
Owner: Henrique Rocha Serrano; target implementation issue to be created.
Prepared: 2026-10-09.
Terminal artifact: one independently reviewed PR against `henriquerochars/tailnext-portfolio`, base branch `final`, with exact-revision verification evidence.

## 1. Intended outcome

Adapt the `manager-for-brokers` engineering-agent harness to this single-application portfolio: canonical instructions, bounded context, documentation validators, isolated reviewed setup, owned processes, shared local/CI gates, revision-bound receipts, typed acceptance, lifecycle skills, delivery planning and a small regression learning loop.

Preserve existing portfolio copy, imagery, links, theme behavior, mobile navigation and production deployment behavior. Build on the existing CI and Playwright suite. This plan authorizes no implementation, hook activation, provider access, deployment or branch-protection changes. Its publication is documentation work only.

## 2. Source and target baselines

Source harness inspected locally at `df614a00fbc2377f1ce7250d993a4ce0d63230f5` in `henriquerochars/manager-for-brokers`. Target files were read through GitHub at `1f6660ec621d710bf721f08ece8108a4523e556a` on 2026-10-09.

| Target evidence | Observed contract |
| --- | --- |
| [Package scripts and versions](https://github.com/henriquerochars/tailnext-portfolio/blob/1f6660ec621d710bf721f08ece8108a4523e556a/package.json) | Next.js 16.3.8, React 19.3.0, Tailwind 4.3.3, TypeScript 5.9.2, Playwright 1.63.0; Node 24.x and Yarn 1.22.22 |
| [Runtime pin](https://github.com/henriquerochars/tailnext-portfolio/blob/1f6660ec621d710bf721f08ece8108a4523e556a/.nvmrc) | Major-only Node `24`; an exact patch is not yet pinned |
| [Current workflow](https://github.com/henriquerochars/tailnext-portfolio/blob/1f6660ec621d710bf721f08ece8108a4523e556a/.github/workflows/ci.yml) | PRs and pushes to `final`; typecheck, lint, build, explicit Chromium preparation, then existing E2E suite |
| [Browser configuration](https://github.com/henriquerochars/tailnext-portfolio/blob/1f6660ec621d710bf721f08ece8108a4523e556a/playwright.config.ts) | Production server at port 3000; local runs may reuse an existing server; CI forbids `.only`, runs one worker and retries once |
| [Existing browser tests](https://github.com/henriquerochars/tailnext-portfolio/blob/1f6660ec621d710bf721f08ece8108a4523e556a/tests/e2e/portfolio.spec.ts) | Main content/console errors, Home/About scrolling, theme, external hrefs and mobile navigation |
| [Repository tree](https://github.com/henriquerochars/tailnext-portfolio/tree/1f6660ec621d710bf721f08ece8108a4523e556a) | `app/`, `components/`, `styles/`, `public/`, flat ESLint configuration and existing tests; no inspected root agent guidance or harness directories |

Dependency ranges in package.json are declarations, not proof of installed versions. No target install, build, browser run or Actions outcome was executed while preparing this plan.

## 3. Scope and prerequisites

Use one implementation issue, one branch such as `chore/portfolio-agent-harness`, and one owned worktree. Re-read the latest `final`, active work and lockfile before implementation; update these evidence anchors if the base moved. Use target issue numbers/URLs, not broker `MB-*` identifiers. A target GitHub Project is not established by the inspected files.

Select a real, available Node 24 patch after baseline verification and pin it consistently for reproducible harness execution; preserve Yarn 1.22.22. Audit the source harness's transitive helpers, fixtures, license obligations and actual tests before porting. Source documentation contains stale deferred-control claims; reconcile them instead of copying status tables.

Exclude pnpm/Turborepo/workspace filters, Prisma/Postgres, broker authorization, channel/webhook workflows, Contentlayer/MDX/RSS/search-generation machinery and provider provisioning. The portfolio has no inspected need for those layers. Do not introduce a content engine, CMS, authentication or reader-facing AI feature.

Keep Linux `/proc`-dependent process supervision explicitly Linux-only unless a portable implementation receives real tests. Portable validators and synthetic harness tests must remain runnable on macOS. Native client discovery/trust and branch protection stay separate evidence gates; repository prose and receipts do not grant permissions.

## 4. Owned files and adaptation map

| Layer | Proposed target files | Required adaptation |
| --- | --- | --- |
| Canonical instructions | `AGENTS.md`, `CLAUDE.md` | English repository artifacts; preserve current product language; engineering index router; 120-line / 11,000 UTF-8-byte root budget |
| Runbooks and registry | `docs/engineering/`, `docs/engineering/maintained-docs.json`, templates | Visible status/owner/source; repo map for this app; preserve README as product/setup entrypoint and link engineering hub |
| Validators | `scripts/agent/{files,prompt-budget,docs-check,spec-templates,skills-validate}.mjs` plus tests | Containment, metadata, links, UTF-8, budgets, generic issue references and negative cases |
| Runtime isolation | `scripts/agent/{bootstrap,run-yarn,process,process-child}.mjs` plus tests | Yarn Classic; exact launcher/runtime fingerprint; no workspace filters; private cache, leases and owned process cleanup |
| Gate contracts | `config/harness/{ci-gates,acceptance-commands}.json`, `scripts/agent/{ci-contract,ci-runner,ci-workflow,check-changed,ticket-acceptance}.mjs` plus tests | One shared source of local/CI selection, commands, deadlines and acceptance |
| Client policy | `.codex/config.toml`, restrictive `.codex/rules/default.rules`, `scripts/agent-hooks/` | Portable repo-scoped candidate; offline/advisory tests; hooks remain uninstalled |
| Lifecycle | `.agents/skills/`, `scripts/agent/context-routing.json`, delivery/watch modules | Start/review/deliver/capture-learning/implement-ticket; target repository/branch; board skills default off without actual configuration |
| Learning loop | Synthetic canary fixtures and `docs/engineering/knowledge-deltas/` | Redacted failure/fix pairs; manual cadence; no fabricated telemetry |
| Existing verification | `.github/workflows/ci.yml`, `playwright.config.ts`, `tests/e2e/portfolio.spec.ts` | Extend current workflow and suite; server ownership and current revision proof |
| Root integration | `package.json`, `.gitignore`, `.nvmrc`, README, PR/issue templates | Preserve commands; add harness entrypoints; intentional exact pin; lockfile changes only for reviewed dependency additions |

Keep shared gate registry/package/workflow edits serialized if parallel ownership is later authorized. This plan itself requests no parallel implementation.

## 5. Ordered implementation slices

### A. Capture baseline and establish instruction routing

Run reviewed immutable Yarn installation and current typecheck/lint/build/E2E in a disposable checkout. Record actual versions, commands, failures and generated outputs; inspect existing GitHub check identity before renaming anything.

Add concise canonical guidance, Claude pointer, engineering index, repo map, local-development/setup/verification/acceptance/CI/review/delivery runbooks, templates and maintained-document registry. Instructions preserve current UI/content and keep issue/task payloads separate from authority. Scope context by task; do not load unrelated provider or broker documents.

Port structural validators and regression fixtures. Missing links/anchors, invalid status, duplicate authority, oversized instructions, malformed UTF-8, path escapes and unknown skill routing must fail with useful bounded diagnostics. Structural success does not prove semantic consistency or client discovery.

### B. Adapt reviewed execution to Yarn Classic

Preserve `yarn lint`, `yarn typecheck`, `yarn build`, `yarn dev`, `yarn start`, `yarn test:e2e` and `yarn test:e2e:ci`. Unlike the blog, `start` already means production and lint already avoids `--fix`. Do not copy Yarn Berry options such as `--immutable`.

Bootstrap executes reviewed fixed argv equivalent to `yarn install --frozen-lockfile --ignore-scripts --non-interactive` with an owned cache and minimal environment. Verify the exact Yarn Classic options against the selected executable. Required native dependency preparation is a separately reviewed named step; never enable all dependency scripts as a workaround. Confirm the package-manager launcher/runtime layout before defining its fingerprint.

Require a clean reviewed commit and matching branch/issue/session. Reject hidden source edits, symlinks outside scope, duplicate claims, changed script definitions and unsupported platform. Keep private state and diagnostics outside tracked source; hold an execution lease for the entire aggregate run. Bound output, command/aggregate duration and cleanup to captured owned process groups. No stored PID, global cache purge or machine-wide kill grants ownership.

### C. Extend the existing browser contract

Disable existing-server reuse for harness-owned verification, while preserving a separately documented developer convenience profile if desired. Give each session an explicit owned loopback port and fail/select a free owned port on collision. Derive both Playwright baseURL and production startup from the same port contract; do not silently attach to another developer's port 3000 server.

Build at the exact candidate, then run `test:e2e:ci` once against the resulting production bundle. Avoid calling `test:e2e` after an already completed build because it rebuilds. Verify startup/readiness, bind failures, timeout and shutdown. The runner owns server descendants and never kills an unrelated listener.

Retain the five existing behavior tests. Add only meaningful gaps: theme persistence across reload, keyboard access for navigation/theme, local profile image loading, and detection of runtime/page errors in addition to console errors. Scope compatibility assertions to existing product behavior; do not change copy, layout, social targets or design to satisfy harness tests. External link tests inspect hrefs and do not require visiting social providers. Define whether retry-recovered tests are acceptable and report retries rather than hiding them.

Inventory `.next/`, TypeScript incremental output, `next-env.d.ts` and Playwright reports/traces. Checks run in owned disposable verification storage and fail on unexpected tracked-source mutation; generated assets cannot be used to excuse arbitrary source changes. Use synthetic fixtures for destructive/negative harness cases; never edit real images or portfolio copy as fixtures.

### D. Share gates, receipts and typed acceptance

Introduce one reviewed gate registry consumed by local selection and CI. Documentation-only changes require documentation/skill/template checks and relevant harness regressions. Application, styles, assets, dependencies, runtime/config, harness code and CI changes select the full structure + quality + production browser baseline. Unknown paths or unavailable base comparison select all gates.

Bind receipts to canonical repository, physical worktree, source/head/tree/base/merge-base, actual source/index bytes, lockfile, Node/Yarn identity, runner/registry code and minimal environment. Record generated-output policy and execution-tree identity. Capture inputs before and after; edits, failures, timeout, interruption or absent required gates invalidate success. Initial receipt is incomplete, so interrupted work cannot preserve a previous passing result.

Explicit reuse requires complete ordered passing gates, identical fingerprints and bounded freshness. Negative tests cover stale head/base, lock/tool/environment changes, hidden edits, changed source during verification, corrupt/missing/duplicate gates, concurrency and expired receipts. Synthetic orchestration is not proof of real install/browser availability.

Acceptance resolves only reviewed `run:` command text or named `check:` gates; use `shell: false`. `human:` remains pending until recorded by a person. Unknown commands, injected shell fragments, malformed issue sections and stale revision all fail. Adapt broker-specific invariant/event validators to generic portfolio/harness contracts where needed; do not retain tenant/channel invariants.

### E. Extend CI and lifecycle contracts

Modify the existing workflow instead of leaving competing pipelines with different gate definitions. Preserve PR and `final` push triggers, explicit Chromium preparation, forbidOnly and production testing. Pin/verify Yarn 1.22.22 explicitly and align the selected Node patch. Use least-privilege permissions; no provider secrets or privileged execution of untrusted PR code.

Add a stable `required-summary` that evaluates all selected gate results even after failures. Missing, failed, cancelled or unexpectedly skipped required checks fail the summary. Tests must demonstrate each state, documentation exemptions and stale revision rejection. Record source SHA, base SHA and actual checked-out integration SHA; local receipts do not replace Actions.

Audit the existing report upload: the CI reporter is currently `github`, while artifact paths include `playwright-report/`. Ensure intended reports are actually generated or document the available traces/test-results. Keep artifact contents bounded and synthetic; do not silently claim an HTML report exists.

Port restrictive policy/adapters as tested offline candidates. Do not activate hooks or make native enforcement/discovery claims. Default-off board adapters require observed target project IDs/fields and separate authorized writes; no broker project configuration survives the port. Skills use `final` as base, exact candidate review and concrete publication boundaries. Delivery planning is dry-run; no auto-merge, deploy or automatic human acceptance.

Port delivery/watch regressions for stale checks/review, changed head/base, unavailable protection and bounded pending polling. Seed a small failure/fix canary for stale receipts, duplicate ownership, reused wrong server, missing CI jobs and unsupported native capability. Keep learning updates evidence-based and manual.

### F. Validate and independently review the exact candidate

Run all selected gates in a clean Linux worktree with the real pinned tools and Chromium. Run portable validator/harness tests on macOS; explicitly report unsupported Linux supervision there. Test two independent Linux sessions and a port collision without terminating an unrelated process. Record revision, tools, commands, results and missing native/admin capabilities.

Request a separate reviewer at the exact source SHA. Review semantic guidance, permissions, package-manager invocation, process ownership, server identity, receipts, gate omissions and failure reporting. Resolve demonstrated findings and rerun affected checks after every candidate change. Keep required missing evidence pending; do not equate documentation status or local green results with enforced protection.

## 6. Acceptance matrix

| Criterion | Positive proof | Required failure proof |
| --- | --- | --- |
| Canonical bounded guidance | Validators and semantic review agree | Broken links, duplicate scope and budget overflow fail |
| Deterministic setup | Real frozen Yarn install, unchanged lockfile, pinned runtime | Wrong tools, lock drift, dirty source and interrupted install fail |
| Owned verification server | Production smoke names candidate/session/port | Existing foreign listener cannot produce a passing receipt |
| Preserved UI | Existing five tests plus justified new assertions pass | Runtime error, broken navigation/theme or wrong href is visible |
| Receipt validity | Identical complete fresh evidence can be explicitly reused | Head/base/tool/source/environment drift rejects reuse |
| CI contract | Actual Actions run and current required-summary | Missing/failed/skipped/cancelled required jobs fail |
| Safe acceptance | Maintainer-owned commands execute fixed argv | Issue command injection and invented human approval are rejected |
| Delivery evidence | Review/checks bind to current source/base/integration | Stale approval or inaccessible protection cannot imply merge readiness |

## 7. Proposed verification commands

Existing entrypoints to preserve and actually execute during implementation:

```sh
yarn install --frozen-lockfile
yarn typecheck
yarn lint
yarn build
yarn playwright install --with-deps chromium
yarn test:e2e:ci
```

Dependency installation and browser preparation require reviewed execution and available network/native permissions; bootstrap installation additionally suppresses lifecycle scripts. The browser command is an explicit CI/Linux capability setup step, not an incidental action of this plan.

New reviewed entrypoints to implement:

```sh
node scripts/agent/prompt-budget.mjs
node scripts/agent/docs-check.mjs
node scripts/agent/spec-templates.mjs
node scripts/agent/skills-validate.mjs
node scripts/agent/ci-workflow.mjs --check
node scripts/agent/harness-canary.mjs
yarn test:harness
```

`test:harness` aggregates relevant structural, setup/process, receipt, acceptance, CI, policy, skills, delivery/watch and canary regressions. Required unavailable capabilities fail; optional client-native probes are a separately reported profile. No command above is claimed to have passed while preparing this document.

## 8. PR delivery, external gates and rollback

Suggested PR title: `chore: add a revision-bound engineering harness for the portfolio`.

The implementation issue requires registry-backed `run:` checks, `check: required-summary` and `human:` independent review at the candidate SHA plus compatibility/OS-limit acceptance. The PR records provenance, owned paths, tool pins, actual results, negative proof, source/base/integration SHAs, actual Actions URL, reviewer identity and all unrun gates.

An administrator separately verifies the observed required check name, branch/ruleset eligibility, enforcement and bypass settings on `final`. Inaccessible administration APIs mean protection is unverified. Native client trust/discovery, production deployment and external-link destination uptime are not inferred from the harness.

Completion means the applicable repository-side layers are wired, tests and clean-install/production-browser evidence exist, and independent findings are resolved. Keep optional board/client/admin limitations explicit. Merge and deployment remain separate owner actions.

Rollback reverts the harness PR and listed verification/config changes. Preserve real images, copy, theme/navigation behavior, existing production setup and host/global client settings. Later hook activation or board/protection writes require their own bounded actions and evidence.

