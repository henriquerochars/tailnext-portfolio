# Verification contract

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

Require a clean reviewed commit and actual source/index bytes, including files hidden by Git index flags. Symlinks/submodules, dirty commits and source drift fail. Unknown paths or a missing base comparison select full verification. Recognized Markdown/document registry paths select structural gates and all relevant harness regressions.

The reviewed gate registry supplies argv/deadlines to both local and CI. The install/archive is disposable. Receipts begin incomplete and pass only after the complete ordered gate set, before/after source/tool/dependency checks and the generated-output manifest. Fingerprints include physical repository/worktree, branch, head/tree/base/merge-base, index and source bytes, lock, dependency tree, tools, runtime platform/architecture, minimal environment and runner/registry bytes through the source snapshot.

Explicit `--reuse` requires an identical complete receipt no older than 30 minutes and matching output bytes. Failure, interruption, missing gates, changed input, corrupt state or timeout cannot preserve previous success.

Generated outputs are limited to `node_modules/`, `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`, `playwright-report/` and `test-results/` inside verification storage. Tracked inputs may never be excused as generated. Reports are actual HTML plus traces/screenshots on failure. Retry-recovered E2Es fail through `failOnFlakyTests`.

The browser gate starts an owned production server on 127.0.0.1, requires its own startup signal and HTTP readiness, runs Chromium, then destroys its group. A foreign listener fails without termination. Existing five behavior tests remain, extended with page errors, image decoding, theme persistence and keyboard behavior.

Remote Preview testing sets `PLAYWRIGHT_BASE_URL=https://EXACT-DEPLOYMENT.vercel.app` and runs `yarn test:e2e:ci`; it starts no local server. Verify project ID, READY state and Git SHA through authenticated Vercel metadata first. A URL alone proves no revision.
