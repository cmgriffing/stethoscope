# github-dom-readiness (new)

## ADDED Requirements

### Requirement: Semantic-hook-first DOM access

All DOM-dependent scoring checks SHALL prefer semantic hooks (element ids, `aria-label`, `title` attributes, `href` patterns, octicon class names, embedded JSON payloads) over styling hooks (layout container classes such as `.Details`, `.Layout-sidebar`, or `prc-*` / `*-module__*` CSS-module classes).

Where a styling hook is unavoidable, the check SHALL support both the legacy selector and the new-UI selector.

#### Scenario: Styling-hook rename resilience

- **WHEN** GitHub renames a layout/CSS-module class without changing ids, aria-labels, octicon names, or embedded payloads
- **THEN** all score checks other than those explicitly depending on the renamed class continue to function

#### Scenario: Shared file-list helper

- **WHEN** a check needs to inspect the root file list (license, README, docs folder)
- **THEN** it uses a single shared file-list helper that gathers filenames from the embedded payload layer and both DOM selector generations

### Requirement: Commit count parsing across UI generations

The commit-count check SHALL parse the commit count from the legacy structure (`.octicon-history` ancestor containing `strong`) and the new structure (the "N Commits" button label), falling back gracefully (returning 0 or the legacy default) when neither is present, without throwing.

#### Scenario: New UI commit count

- **WHEN** the page contains a commit link whose label text matches /^\s*[\d,.\s]+(k)?\s*Commits\s*$/i
- **THEN** the parsed count equals the displayed count (formatted-number strings like "1,234" are scrubbed and parsed)

### Requirement: Hydration-safe scoring

Scoring SHALL re-run (or defer completion) when data known to hydrate late is not yet present, so that async-rendered content (e.g. commit timestamps, contributor counts) is not permanently missed by a single fire-once evaluation. Re-scoring SHALL be bounded: at most a fixed number of retries within a fixed window, and later successful evaluations SHALL replace earlier partial results in the background script.

#### Scenario: Late-hydrated commit dates

- **WHEN** no commit `datetime` attributes are present at first evaluation and they appear within the retry window
- **THEN** the final reported score reflects the hydrated data rather than the empty initial state

### Requirement: Fixture-based regression coverage

The repository SHALL maintain saved HTML fixtures representing both GitHub UI generations (legacy and React/CSS-module) for repo root pages, and the DOM-dependent detection logic (license detection, file list, commit count, stars, issues) SHALL be verifiable against these fixtures without live network access.

#### Scenario: New UI migration

- **WHEN** GitHub ships a UI change that breaks detection
- **THEN** the failure is reproduced by updating/adding a fixture, and fixed selectors are verified against fixtures before shipping

#### Scenario: Dual-generation coverage

- **WHEN** the fixture harness runs
- **THEN** every DOM-dependent check is exercised against both a legacy-UI fixture and a new-UI fixture