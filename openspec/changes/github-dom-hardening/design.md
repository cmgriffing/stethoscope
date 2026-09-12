# Design: GitHub DOM Hardening

## Context

The content script (`src/content/main.ts`) scrapes the rendered GitHub DOM at scoring time. GitHub's incremental migration to a React code view with CSS-module class names broke every styling-hook selector. Verified findings (sindresorhis/is live snapshot):

- File list: `.react-directory-row` rows with `a[title][aria-label]` — no `.Details` wrapper.
- Sidebar: `prc-PageLayout-Pane-*`, `SidebarSection-module__*` — no `.Layout-sidebar`. Law octicon still `octicon-law`.
- Embedded SSR JSON payloads contain the file list (`"name": "license"`) and sidebar section data (`"sections": {"releases": {"releaseCount": 51}, "sponsors": true, …}`).
- Commit count: "256 Commits" inside a `prc-Button-Label` span; legacy `strong` lookup gone.
- `datetime` attributes absent from SSR; hydrate late.
- Stars (`#repo-stars-counter-*`), issues (`#issues-repo-tab-count`), author (`a[rel="author"]`), repo header (`#repository-container-header`) still semantic and working.

## Decisions

### D1 — Layered detection, semantic-first

Detection order: embedded JSON payload → semantic DOM attributes → API (license only). Rationale: payload JSON and semantic attributes survive class renames; CSS-module selectors do not. The API layer is limited to license and only as fallback to respect the 60 req/hr unauthenticated rate limit — one request per scoring run, only on DOM failure.

- Payload parsing: read `<script type="application/json">` elements whose `id`/content shape matches GitHub's embedded data (`react-app.embeddedData`), tolerate absence/malformation, search recursively for file-list `name` fields and `sections`/license indicators. Defensive: unknown shapes are skipped, never thrown.
- Semantic filename matching: case-insensitive regex over href basenames and title/aria-label text: `licen[cs]e`, `copying`, `unlicen[cs]e`, with boundary handling for compound names (`LICENSE-MIT`, `MIT-LICENSE.txt`, `COPYING.LESSER`).
- Legacy + new UI selectors both compiled into the selector sets (dual-mode), since rollout is per-repo.

### D2 — Shared file-list helper

One helper exposes root file names gathered from all sources (payload names, new-UI row titles, legacy `.Details` titles, blob hrefs). License, README, and docs-folder checks consume it. This collapses three near-duplicate filename lists (license/readme/docs currently enumerate case × extension combinatorics) into one source of truth with per-check match patterns.

### D3 — Hydration safety without observers-everywhere

Current flow evaluates once per message; late-hydrating data (commit dates, contributors) can be absent. Rather than threading MutationObservers through every check, use a bounded re-evaluation: if known-late signals are missing (no `datetime` elements, no contributor count), schedule a small number of delayed re-runs (e.g. 3 × ~1.5s) and send the score again; the background script already keys scores by tab id and overwrites. Config-change messages keep working as today.

### D4 — hasAmbiguousLicense wiring

Flag exists in `ScoreDetails` and defaults false; popup renders it as a distinct "license exists but unidentified" state when API fallback returns `NOASSERTION`. DOM-detected licenses (by filename) are not ambiguous — GitHub's licensee-based sidebar data would be needed for stronger identification, which is out of scope.

### D5 — Fixtures over live-site testing

Save two repo-root HTML snapshots (legacy UI repo, new-UI repo) as test fixtures, plus a minimal JSDOM-based harness (or equivalent lightweight DOM emulation) to run `checkForLicense`, the file-list helper, and the numeric parsers against fixtures. Network-dependent layer (API fallback) is behind an injectable fetch so tests stub it. Fixtures are checked into the repo; adding a fixture is the documented response to future GitHub migrations.

## Risks / Trade-offs

- **Embedded payload shape is undocumented** — GitHub can change JSON keys. Mitigation: L2 semantic DOM layer is independent; payload parsing is best-effort and non-throwing.
- **API rate limits on heavy browsing** — mitigated by DOM-first ordering; API only fires when DOM finds nothing, which post-fix is rare (unlicensed repos will hit it once per repo page view; acceptable, and failure is graceful: `hasLicense: false`).
- **JSDOM fidelity** — fixture harness approximates the browser; octicons/aria attributes render fine, hydration does not. Hydration scenarios are verified by the bounded re-run logic's unit tests (timers faked), not by fixtures.
- **Scope creep** — commit-frequency/most-recent-commit depend on late `datetime` data; full reliability there is bounded by D3's retry, not solved outright.

## Migration Plan

1. Land the shared file-list helper + new license detection (biggest user-visible fix) with fixtures.
2. Land commit-count parsing fix and hydration-safe re-scoring.
3. Wire `hasAmbiguousLicense` + popup state.
4. Update remaining file-list checks (README, docs) onto the helper.

## Open Questions

- None blocking. (Deferred: whether releases/contributors counts should also gain an API fallback — observe post-fix behavior first.)