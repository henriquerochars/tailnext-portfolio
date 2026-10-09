# Codex project candidate

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

The project `.codex/config.toml` uses workspace-write, on-request approval and network-disabled sandbox defaults. Restrictive rules contain no allow prefix. Trusted project loading, native rule behavior and skill discovery require a separate explicit native probe; repository validation does not prove them.

No hook installation, trust changes, authentication material, model override or absolute machine path is included. See [command policy](command-policy.md).

Official references: [AGENTS.md](https://developers.openai.com/codex/guides/agents-md), [rules](https://developers.openai.com/codex/rules), [skills](https://developers.openai.com/codex/skills).
