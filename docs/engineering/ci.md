# Continuous integration

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

The existing Linux check identity `validate` remains. `structure` validates docs, templates, skills, generated workflow, learning canary and harness regressions. `validate` and `validate-macos` execute the same reviewed full production baseline on Ubuntu and macOS, including isolated frozen installs and explicit Chromium preparation.

`plan` records source/base/integration SHA and selects jobs. `required-summary` always evaluates the plan and every declared job, rejecting missing, failed, cancelled or unexpected skipped evidence. Docs-only exemptions must be explicit and contain no success record. Local receipts do not replace Actions.

Workflow permissions are contents-read, checkout credentials are not persisted, and no provider credentials are passed to reviewed commands. Actions are pinned by commit. Regenerate with `node scripts/agent/ci-workflow.mjs --write`; check with `--check`.

Vercel uses its existing Git integration and ordinary Next build. `engines.node=24.x` overrides the older dashboard runtime; Vercel controls patches. Versioned install/build commands explicitly invoke Yarn 1.22.22. The exact harness patch guard never runs in Vercel prebuild. Verify real build tool versions, READY metadata and the candidate SHA before remote E2E.

An administrator must separately inspect required check names and enforcement on `final`. No harness file installs branch protection.
