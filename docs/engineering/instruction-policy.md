# Instruction validation

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

AGENTS.md is canonical; CLAUDE.md is a pointer. Scoped instructions require exact path/scope registration. Validators enforce containment, UTF-8, metadata/status, links/anchors, duplicate authority and root budgets. Remote links are syntax-only, not fetched. Maintained document metadata lives in `maintained-docs.json`; visible status must agree.

Live guidance is current authority; Proposed needs acceptance; Frozen evidence describes history; Superseded points to registered Live guidance. These statuses never imply completed implementation or external enforcement. Semantic contradictions require reviewer judgment.
