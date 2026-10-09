# Reviewed bootstrap

Status: Live
Owner: [Issue #17](https://github.com/henriquerochars/tailnext-portfolio/issues/17)
Source: Adapted from manager-for-brokers df614a00fbc2377f1ce7250d993a4ce0d63230f5; exact candidate execution evidence belongs in the implementation PR.

## Pinned tools

Use Node **24.21.0**, Yarn Classic **1.22.22** and a clean task branch. Provision Node through your approved runtime manager. Install Yarn into an owned tool directory with `npm install --prefix /absolute/owned-tools --ignore-scripts --no-audit --no-fund yarn@1.22.22`; set `HARNESS_YARN=/absolute/owned-tools/node_modules/yarn/bin/yarn.js`. The harness hashes Node, Yarn launcher, manifest and CLI bytes. It also accepts the exact Yarn launcher passed by Yarn through `npm_execpath`.

## Setup

```sh
yarn harness:setup --revision FULL_SHA --issue 17 --session review-one
yarn harness:verify --revision FULL_SHA --base BASE_SHA --issue 17 --session review-one
yarn harness:verify --revision FULL_SHA --base BASE_SHA --issue 17 --session review-one --reuse
```

Setup exports the reviewed commit into private temporary storage and runs frozen, noninteractive installation with `--ignore-scripts --production=false`. Native Next/SWC, Tailwind and TypeScript binaries are shipped in reviewed optional packages; no lifecycle exception is needed by the validated stack. Chromium/system preparation is an explicit gate.

Every harness Yarn invocation uses `--no-default-rc`; ambient/ancestor/home rc files cannot select a script shell. Private empty npm configuration and the exact Yarn shim are canonical ordinary files with checked bytes/modes; unexpected private executables fail. These execution inputs join the receipt fingerprint and before/after checks.

State is in the OS temporary directory under `portfolio-harness-UID/WORKTREE_HASH`, mode 0700; records use 0600. One physical worktree claim binds branch/issue/session/revision. A live execution lease spans setup or the aggregate verification. A duplicate or stale lease fails closed. After interruption, inspect the recorded claim, actual owned descendants and logs manually. Never kill a stored PID. Use a fresh worktree/session when advancing the reviewed revision; do not edit claims to impersonate another run.

macOS and Linux use a detached live guardian with IPC and an owned POSIX process group. Disconnect/deadline/cancellation destroys descendants while the guardian retains group identity. Persisted identity is diagnostic only. Commands capture at most 1 MiB and have registry deadlines; verification is bounded to 20 minutes. Windows is unsupported.

A reviewed Node preload keeps subprocesses in the guardian group, including Playwright's normally detached browsers. Only the exact nested harness guardian launcher may create another self-cleaning group. This supervises reviewed Node/Yarn entrypoints and their normal native descendants; it is not containment for hostile code that invokes native `setsid` or deliberately bypasses the preload.
