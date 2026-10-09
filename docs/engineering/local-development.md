# Local development

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

`yarn dev` starts ordinary Next development. `yarn start` serves a production build. Existing `yarn typecheck`, `yarn lint`, `yarn build`, `yarn test:e2e` and `yarn test:e2e:ci` remain available.

`test:e2e` builds then runs browsers; after a completed build use `test:e2e:ci`. Developer Playwright runs start their own loopback production server and never reuse a listener. Set `HARNESS_PORT` to an explicit free port. Harness verification uses private installation/build/output directories and chooses a deterministic session port.

TypeScript 7 is the CLI compiler through `@typescript/native`; `typescript` aliases the official TypeScript 6 API package for Next, ESLint and the editor plugin. Keep the aliases together. See [implementation decision](implementation-decision.md).
