# Manual learning loop

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

Use redacted failure/fix pairs after a real task. Record revision, trigger, observed failure, bounded fix and regression path. No automatic telemetry or learning write is enabled. The synthetic canary covers stale receipt, duplicate worktree claim, foreign listener, missing CI job and unsupported native capability; missing telemetry remains unknown.
