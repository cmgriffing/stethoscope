# Tasks: GitHub DOM Hardening

## 1. Fixture foundation

- [x] 1.1 Capture and commit two repo-root HTML fixtures: legacy-UI repo and new-UI (React/CSS-module) repo (scrub any session/CSRF tokens before committing)
- [x] 1.2 Add a lightweight DOM test harness (JSDOM or equivalent) that loads fixtures and exports the parsed document; wire `pnpm test` (vitest) into the repo
- [x] 1.3 Extract `fetch` behind an injectable seam in the content script so the API layer can be stubbed in tests

## 2. Shared file-list helper (semantic-first)

- [x] 2.1 Implement embedded-payload reader: collect `<script type="application/json">` payloads, locate file-list entries (recursive `name` search), non-throwing on unknown shapes
- [x] 2.2 Implement file-name gathering from semantic DOM: new-UI `.react-directory-row a[title]`, legacy `.Details a[title]`, blob hrefs (`/blob/<ref>/<name>` base names)
- [x] 2.3 Unify into a single `getRootFileList()` helper returning filenames (verbatim case) + case-insensitive matching utility

## 3. License detection rework

- [x] 3.1 Rewrite `checkForLicense()` as layered detection: payload → semantic DOM (file match, law octicon without `.Layout-sidebar`, `#user-content-license*` anchors, `opensource.org/licenses` hrefs) → legacy selectors
- [x] 3.2 Case-insensitive + fuzzy license filename patterns: `licen[cs]e`, `copying`, `unlicen[cs]e`, compound names (`LICENSE-*`, `*-LICENSE`), any/no extension
- [x] 3.3 Implement API fallback layer: one fetch to `https://api.github.com/repos/{owner}/{repo}` on DOM failure; map `license.spdx_id` to `hasLicense`; `NOASSERTION` also sets `hasAmbiguousLicense`
- [x] 3.4 Fixture tests: lowercase `license` file, `COPYING`, `LICENSE-MIT`, new-UI repo with no README license section, legacy-UI repo, API-fallback and NOASSERTION paths (stubbed fetch)

## 4. Commit count + hydration safety

- [x] 4.1 Fix `getCommitCount()` for new-UI "N Commits" button-label structure while keeping legacy `.octicon-history`/`strong` path; scrub formatted numbers
- [x] 4.2 Implement bounded re-scoring when late-hydrating signals are missing (commit `datetime` elements, contributor count): limited retries within a window, re-send `ScoreCalculated` (background already overwrites by tab id)
- [x] 4.3 Unit tests with faked timers for the retry path; fixture tests for commit-count parsing on both generations

## 5. Remaining file-list checks + popup

- [x] 5.1 Migrate `checkForReadme()` and `checkForDocumentation()` onto the shared file-list helper (case-insensitive match patterns)
- [x] 5.2 Verify stars/issues/author/repo-name checks against both fixtures; adjust only where broken
- [x] 5.3 Popup: render distinct "license exists but unidentified" state for `hasAmbiguousLicense`
- [x] 5.4 Runtime verification pass (manual or scripted) of contributors/releases/sponsor/build-status signals on a new-UI repo; file follow-up issues for any that need their own rework

## 6. Wrap-up

- [x] 6.1 Manual smoke test: score a known new-UI licensed repo and a known unlicensed repo end-to-end in Chrome
- [x] 6.2 Update README/docs notes about the detection strategy and fixture workflow for future migrations