# Delivery boundaries

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

`deliver-pr.mjs` and `watch-pr.mjs` are pure bounded readiness assessment helpers. They require matching local receipt, source/base/integration Actions evidence, independent review, tested READY Vercel Preview and separately verified protection. Missing administrative access remains pending.

One implementation PR against `final` records provenance, pins, commands, actual OS results, negative proof, Actions/Preview URLs and review identity. Do not claim skipped checks passed. Publication of an implementation PR does not authorize merge, production deployment, hook installation, board writes or protection changes.

Rollback reverts the implementation PR. Existing portfolio copy/assets and host/global client settings are preserved.
