import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

/**
 * Loads the saved GitHub repo-root HTML fixtures into a parsed DOM.
 *
 * Fixtures are captured by `scripts/capture-fixtures.mjs`; see
 * `src/content/__fixtures__/README.md` for provenance.
 */

export type UiGeneration = "legacy" | "new-ui";

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "__fixtures__"
);

const FIXTURE_FILES: Record<UiGeneration, string> = {
  legacy: "github-repo-root.legacy.html",
  "new-ui": "github-repo-root.new-ui.html",
};

const FIXTURE_URLS: Record<UiGeneration, string> = {
  legacy: "https://github.com/jquery/jquery",
  "new-ui": "https://github.com/sindresorhus/is",
};

export const FIXTURE_REPOS: Record<UiGeneration, { owner: string; repo: string }> =
  {
    legacy: { owner: "jquery", repo: "jquery" },
    "new-ui": { owner: "sindresorhus", repo: "is" },
  };

const htmlCache = new Map<UiGeneration, string>();

export function loadFixtureHtml(generation: UiGeneration): string {
  const cached = htmlCache.get(generation);
  if (cached !== undefined) {
    return cached;
  }
  const html = readFileSync(join(FIXTURES_DIR, FIXTURE_FILES[generation]), "utf8");
  htmlCache.set(generation, html);
  return html;
}

const documentCache = new Map<UiGeneration, Document>();

/** Parses the fixture into a Document (URL set so `location.pathname` works). */
export function loadFixtureDocument(generation: UiGeneration): Document {
  const cached = documentCache.get(generation);
  if (cached !== undefined) {
    return cached;
  }
  const dom = new JSDOM(loadFixtureHtml(generation), {
    url: FIXTURE_URLS[generation],
  });
  documentCache.set(generation, dom.window.document);
  return dom.window.document;
}
