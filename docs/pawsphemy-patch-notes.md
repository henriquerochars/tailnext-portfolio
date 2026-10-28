# Pawsphemy patch notes updates

The portfolio's release archive is a manually reviewed snapshot, not a live feed. The
[official changelog](https://github.com/henriquerochars/pawsphemy/blob/main/CHANGELOG.md)
is the source of truth. As inspected on 2026-10-28 it contains only Unreleased and
explicitly states that no release has been published. The site links to the current
source for unreleased work and to the separate gameplay GIF directory. The upstream
repository is currently private; these links require access. Recheck visibility when
updating and revise the access notice when appropriate.

When updating, inspect the changelog at a specific upstream commit and record that
commit in the change description. Add only published versioned entries to
`data/pawsphemy-releases.ts`, with their actual version, ISO date and faithful full
explanation. Do not turn Unreleased or an update period into a release. If a version
has no confirmed publication date, leave it pending until verified; do not guess.
Review upstream release status as well as changelog headings. Keep the archive empty
when no published version is documented.

GIFs in `docs/gifs` are gameplay evidence, not automatically release-specific. Attach
one to a release only when upstream evidence supports the association; use a stable
asset URL and descriptive alt text. Otherwise leave `gifs` empty. Check links and
image accessibility, update the pending copy if its factual premise changes, and run
the repository verification and relevant archive tests. This is a manual update; no
upstream changes are imported automatically.

The unreleased development summary in `data/pawsphemy-unreleased.ts` is a manually maintained editorial snapshot of the official changelog, pinned to the game commit recorded in that file. Refresh its three translations when the owner requests an update. Its date range comes from the changelog and is not a release date. Published releases continue to use the separate archive.
