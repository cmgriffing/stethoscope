# license-detection (new)

## ADDED Requirements

### Requirement: Layered license detection

The extension SHALL detect a repository license by attempting detection layers in priority order, stopping at the first success:

1. **Embedded payload layer**: parse GitHub server-rendered `<script type="application/json">` payloads (e.g. `react-app.embeddedData`) for license-file entries in the embedded file list and for sidebar license indicators in the embedded sections/sidebar data.
2. **Semantic DOM layer**: detect license files and license indicators via semantic attributes — anchor `href` matching `/{owner}/{repo}/blob/<ref>/<name>` where `<name>` matches a license filename pattern case-insensitively, anchor `title`/`aria-label` matching license filename patterns (both old-UI `.Details a[title]` and new-UI `.react-directory-row a[title]` selectors), the sidebar law octicon (`octicon-law` matched without requiring `.Layout-sidebar`), README license-section anchors (`#user-content-license*`), and `opensource.org/licenses` hrefs.
3. **API fallback layer**: when layers 1–2 find nothing, fetch `https://api.github.com/repos/{owner}/{repo}` and treat a non-null `license` object as licensed.

The API fallback layer SHALL be invoked at most once per scoring run and only when the DOM layers find nothing.

#### Scenario: License file with lowercase name

- **WHEN** the repository contains a root file named `license` (any casing) with or without an extension
- **THEN** the extension reports `hasLicense: true`

#### Scenario: Fuzzy license filenames

- **WHEN** the repository contains a root file matching `COPYING*`, `UNLICENSE*`, `LICENCE*` (any casing), `LICENSE-<identifier>`, `<identifier>-LICENSE`, or any of the above with any extension (`.md`, `.txt`, `.html`, or none)
- **THEN** the extension reports `hasLicense: true`

#### Scenario: New GitHub UI repository

- **WHEN** the repository page is served with the React/CSS-module UI (no `.Details` or `.Layout-sidebar` containers)
- **THEN** license detection still succeeds via the embedded payload layer, the semantic attribute layer, or both

#### Scenario: Old GitHub UI repository

- **WHEN** the repository page is served with the legacy UI
- **THEN** license detection still succeeds via the legacy `.Details` / `.Layout-sidebar` selectors

#### Scenario: DOM detection exhausted

- **WHEN** neither the payload layer nor the semantic DOM layer finds a license
- **THEN** the extension performs exactly one request to the GitHub repositories API for the current repo and reports `hasLicense: true` if the API reports a license

#### Scenario: API reports no license

- **WHEN** the API fallback is used and the API response has no `license` object
- **THEN** the extension reports `hasLicense: false` without further license attempts

### Requirement: Ambiguous license flag

The extension SHALL set `hasAmbiguousLicense: true` when license evidence is ambiguous — specifically when the API fallback returns `spdx_id: "NOASSERTION"`.

#### Scenario: API returns NOASSERTION

- **WHEN** the API fallback returns a license object with `spdx_id` equal to `"NOASSERTION"`
- **THEN** `hasLicense` is `true` and `hasAmbiguousLicense` is `true`

#### Scenario: Popup communicates ambiguity

- **WHEN** a scored repository has `hasAmbiguousLicense: true`
- **THEN** the popup indicates that a license exists but could not be identified, distinct from the "No License found" state