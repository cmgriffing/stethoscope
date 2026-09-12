# GitHub DOM Hardening

## Why

The extension's score is broken on repos served GitHub's new React/CSS-module UI. Verified live (sindresorhus/is, 2024-era new code view): the file list is now `.react-directory-row` (not `.Details a[title=…]`), the About sidebar uses `prc-PageLayout-*` / `SidebarSection-module__*` classes (not `.Layout-sidebar`), commit dates are absent from SSR HTML, and the commit count lives in a `prc-Button-Label` span instead of a `strong` tag. GitHub is rolling this out per-repo, which is why license detection (and every score downstream of it) fails only on *some* repos.

License detection is the hard gate: when `checkForLicense()` fails, the whole score is skipped ("No License"). Even on the old DOM, lowercase filenames like `license` (sindresorhus/is uses exactly this) are missed because only capitalized variants are listed.

Root cause pattern: the content script couples to **styling hooks** (`.Details`, `.Layout-sidebar`, CSS-module names) that GitHub renames freely, instead of **semantic hooks** (ids, aria-labels, title attributes, hrefs, octicon names, embedded JSON payloads).

## What Changes

- Rework `checkForLicense()` into a layered detector, in priority order:
  - **L1 – Embedded payload JSON**: parse GitHub's SSR `<script>` payloads (`react-app.embeddedData` and similar) for the file list and sidebar sections data (e.g. `"sections": {"releases": {"releaseCount": …}, "sponsors": true, …}`).
  - **L2 – Semantic DOM attributes**: match file/sidebar anchors by blob href (`/blob/<ref>/<filename>`), `title`, `aria-label`, and octicon names — case-insensitive, with fuzzy license names (`COPYING*`, `UNLICENSE`, `*-LICENSE`, `LICENSE-*`), any extension. Keep old `.Details` selectors as dual-mode fallback for repos still on the old UI.
  - **L3 – GitHub API fallback (license only)**: when DOM layers find nothing, fetch `https://api.github.com/repos/{owner}/{repo}` and use `license.spdx_id`. `NOASSERTION` maps to `hasAmbiguousLicense`. At most one network request, only in the failure case.
- Rework the file-list-dependent checks (README present, docs folder) onto the same shared file-list helper.
- Fix commit count parsing for the new button-label structure; keep the old selector.
- Add hydration-safe re-scoring (delayed re-check / MutationObserver) so late-hydrating data (commit dates, contributors) is not missed by the fire-once flow.
- Wire up the existing-but-never-set `hasAmbiguousLicense` flag.
- Add a fixture-based regression harness (saved old-UI and new-UI GitHub HTML snapshots) so future GitHub migrations are a fixture update, not live-site archaeology.

## Capabilities

### New Capabilities

- `license-detection`: Layered license discovery (embedded payload → semantic DOM → API fallback) with case-insensitive and fuzzy filename matching.
- `github-dom-readiness`: Semantic-hook-first DOM access, hydration-safe scoring, and fixture-based regression coverage for GitHub UI migrations.

## Impact

- Affected specs: `license-detection` (new), `github-dom-readiness` (new)
- Affected code:
  - `src/content/main.ts` — license detection, file-list helper, commit count, scoring flow, re-scoring
  - `src/data.ts` / `src/types.ts` — `hasAmbiguousLicense` surfacing
  - `src/popup/Popup.tsx` — ambiguous-license messaging (minor)
  - new: fixtures + harness under `src/content/__fixtures__/` (or `tests/`)

## Non-goals

- Replacing all checks with the GitHub API (only license uses the API, and only as fallback — avoids 60 req/hr unauthenticated rate limits).
- Support for non-repo GitHub pages (the 2-segment URL gate stays).
- Fixing Firefox-specific packaging issues (separate concern, already handled in build scripts).