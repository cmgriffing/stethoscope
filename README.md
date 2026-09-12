# React + Vite + CRXJS

This template helps you quickly start developing Chrome extensions with React, TypeScript and Vite. It includes the CRXJS Vite plugin for seamless Chrome extension development.

## Features

- React with TypeScript
- TypeScript support
- Vite build tool
- CRXJS Vite plugin integration
- Chrome extension manifest configuration

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory.

4. Build for production:

```bash
npm run build
```

## Project Structure

- `src/popup/` - Extension popup UI
- `src/content/` - Content scripts
- `manifest.config.ts` - Chrome extension manifest configuration

## Documentation

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [CRXJS Documentation](https://crxjs.dev/vite-plugin)

## Scoring & GitHub DOM detection

The content script scores a GitHub repository page (`src/content/main.ts` +
`src/content/detection.ts`). GitHub serves two code-view generations (legacy
and React/CSS-module) and renames styling hooks freely, so checks prefer
**semantic hooks**:

1. **Embedded payload** — `react-app.embeddedData` JSON (root file list,
   sidebar sections, repo license object).
2. **Semantic DOM** — ids, `aria-label`/`title` attributes, blob/tree hrefs,
   octicon names, section headings.
3. **Legacy selectors** — `.Details`, `.Layout-sidebar` (dual-mode fallback).
4. **GitHub API** — license only, at most one request per scoring run, and
   only when the DOM layers find nothing. `NOASSERTION` maps to
   `hasAmbiguousLicense`, which the popup shows as an unidentified license.

Late-hydrating signals (commit dates, contributor counts) schedule up to three
bounded re-scores; the background script replaces the earlier partial score
for the tab.

### Tests and fixtures

`pnpm test` runs Vitest against saved repo-root HTML fixtures:

- `src/content/__fixtures__/github-repo-root.legacy.html` — legacy UI
  (jquery/jquery via the Wayback Machine)
- `src/content/__fixtures__/github-repo-root.new-ui.html` — React code view
  (sindresorhus/is)

When GitHub ships a UI migration, capture fresh pages with
`node scripts/capture-fixtures.mjs` (scrubs CSRF tokens and nonces before
writing), reproduce the failure in `src/content/__tests__`, then fix the
selectors. See `src/content/__fixtures__/README.md` for provenance and
refresh rules.

## Chrome Extension Development Notes

- Use `manifest.config.ts` to configure your extension
- The CRXJS plugin automatically handles manifest generation
- Content scripts should be placed in `src/content/`
- Popup UI should be placed in `src/popup/`
