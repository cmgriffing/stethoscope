# GitHub repo-root HTML fixtures

Saved GitHub repository pages used by the DOM detection tests
(`src/content/__tests__`). They let the detection logic be exercised offline
and make future GitHub UI migrations a fixture update instead of live-site
archaeology.

| File                          | UI generation                    | Source                                                                |
| ----------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| `github-repo-root.legacy.html` | Legacy (`.Details`, `.Layout-sidebar`) | [jquery/jquery](https://github.com/jquery/jquery) via the Wayback Machine snapshot `20230601000000` |
| `github-repo-root.new-ui.html` | React code view (`.react-directory-row`, embedded JSON payload) | Live [sindresorhus/is](https://github.com/sindresorhus/is) snapshot |

Notes:

- **Tokens are scrubbed.** `scripts/capture-fixtures.mjs` replaces CSRF input
  values, `csrf_tokens`, `uploadToken`, and CSP `nonce` values before writing.
  Never commit an un-scrubbed capture.
- **Refresh with** `node scripts/capture-fixtures.mjs`. The script validates
  each page still contains UI-generation-specific markers before overwriting a
  fixture, and keeps the existing file if a fetch fails.
- **Do not hand-edit the HTML**; update the capture script or re-capture.
- The legacy fixture comes from the Wayback Machine because GitHub no longer
  serves the legacy code view. If that snapshot disappears, capture another
  archived legacy page and update the source table and
  `scripts/capture-fixtures.mjs`.
