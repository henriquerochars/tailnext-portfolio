# Implementation decisions and provenance

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

The original [plan](../plans/engineering-harness-implementation-plan.md) was recovered from commit 5ba7ff6e18626d2fce2b6235470557810e872243. Remote `final` was force-updated to c412b3a05e2f5d9f06b015969b85d49ca7c3709d. The user selected modern local commit 1f6660ec621d710bf721f08ece8108a4523e556a as the functional baseline. Reconciliation preserves that UI and records the old remote as parent. The only remote source change after their merge-base was cursor styling in the superseded react-scroll navbar; current buttons preserve the behavior.

The user approved all stable dependency updates, Node 24 LTS, one PR with separate commits and full native Linux/macOS execution. Node 24.21.0 and Yarn 1.22.22 are exact harness pins; Vercel remains on major 24.x. Stack: Next/eslint-config-next 16.4.0, ESLint 10.12.0, Playwright 1.64.0, PostCSS 8.5.29, React 19.3.0, Tailwind 4.3.3. TypeScript 7.0.2 CLI coexists with official @typescript/typescript6 6.0.2 API compatibility through aliases.

The dependency checkpoint actually passed script-free installation, typecheck, lint, production build and the existing five Chromium tests on macOS. Yarn emitted peer-range warnings for upstream ESLint plugins; actual lint passed. Native packages worked without lifecycle scripts. No production safety claim is inferred from a version pin.

The existing Vercel production domain was READY at 5ba7ff6; the later c412b3a deployment failed before install because dashboard Node 18.x is discontinued. This is a preexisting failure, proven by build logs. The candidate declares engines 24.x and requires real Preview validation.

Structural helpers/docs/CI concepts are adapted from the same owner's manager-for-brokers source df614a00fbc2377f1ce7250d993a4ce0d63230f5. No broker-specific app code, pnpm, databases or provider authority was ported. The source checkout has no root license file; provenance is retained and no new upstream license claim is invented.

Official migration references: [TypeScript 7 side-by-side guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [Next 16.4](https://nextjs.org/blog/next-16-4), [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). The Next project announced an October 14, 2026 security update; recheck advisory/release status before merging or production promotion.
