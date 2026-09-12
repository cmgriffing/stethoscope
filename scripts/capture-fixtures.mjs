#!/usr/bin/env node
/**
 * Captures the repo-root HTML fixtures used by the DOM detection tests.
 *
 * Sources:
 *   - new UI (React/CSS-module code view): live github.com/sindresorhus/is
 *   - legacy UI (`.Details` / `.Layout-sidebar`): Wayback Machine snapshot of
 *     github.com/jquery/jquery (2023-06-01)
 *
 * Fetched HTML is scrubbed of CSRF tokens / nonces before writing, so no
 * session-scoped values are committed. If a fetch fails, the existing fixture
 * is kept (the script never deletes a working fixture).
 *
 * Usage: node scripts/capture-fixtures.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = join(repoRoot, "src", "content", "__fixtures__");

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const SOURCES = [
  {
    name: "new UI",
    url: "https://github.com/sindresorhus/is",
    output: "github-repo-root.new-ui.html",
    // A marker that only exists in the React code view.
    requiredMarkers: ["react-directory-row", "react-app.embeddedData"],
  },
  {
    name: "legacy UI",
    url: "https://web.archive.org/web/20230601000000id_/https://github.com/jquery/jquery",
    output: "github-repo-root.legacy.html",
    // Markers that only exist in the pre-React code view.
    requiredMarkers: ["class=\"Details", "Layout-sidebar"],
  },
];

/**
 * Replaces the value of `"key": {...}` in an HTML-embedded JSON blob with
 * `{}`, scanning braces so nested objects are scrubbed too.
 */
function scrubObjectValue(html, key) {
  const keyPattern = new RegExp(`"${key}"\\s*:\\s*\\{`, "g");
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = keyPattern.exec(html))) {
    const start = match.index + match[0].length - 1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let i = start;
    for (; i < html.length; i++) {
      const char = html[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
      } else if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          break;
        }
      }
    }
    result += html.slice(lastIndex, start) + "{}";
    lastIndex = i;
    keyPattern.lastIndex = i;
  }
  return result + html.slice(lastIndex);
}

function scrub(html) {
  let scrubbed = html
    // Legacy UI: hidden CSRF inputs.
    .replace(/<input\b[^>]*\bdata-csrf="true"[^>]*>/g, (tag) =>
      tag.replace(/\bvalue="[^"]*"/, 'value="scrubbed-csrf-token"')
    )
    // Embedded payload tokens / nonce.
    .replace(/"uploadToken"\s*:\s*"[^"]*"/g, '"uploadToken":""')
    .replace(/"authenticity_token"\s*:\s*"[^"]*"/g, '"authenticity_token":""')
    .replace(/\bnonce="[^"]*"/g, 'nonce="scrubbed-nonce"');
  scrubbed = scrubObjectValue(scrubbed, "csrf_tokens");
  return scrubbed;
}

async function capture({ name, url, output, requiredMarkers }) {
  const outputPath = join(fixturesDir, output);
  process.stdout.write(`Capturing ${name} fixture from ${url}\n`);
  let html;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    html = await response.text();
  } catch (error) {
    if (existsSync(outputPath)) {
      process.stdout.write(
        `  ! fetch failed (${error.message}); keeping existing ${output}\n`
      );
      return;
    }
    throw error;
  }

  const missing = requiredMarkers.filter((marker) => !html.includes(marker));
  if (missing.length > 0) {
    throw new Error(
      `${name} fixture is missing expected markers (${missing.join(
        ", "
      )}); refusing to overwrite ${output}. GitHub may have changed UI again.`
    );
  }

  await writeFile(outputPath, scrub(html));
  process.stdout.write(`  wrote ${output} (${html.length} bytes)\n`);
}

await mkdir(fixturesDir, { recursive: true });
for (const source of SOURCES) {
  await capture(source);
}
