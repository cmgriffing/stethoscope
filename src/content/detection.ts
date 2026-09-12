/**
 * DOM detection helpers for the scored GitHub repository page.
 *
 * GitHub renames styling hooks (`.Details`, `.Layout-sidebar`, `prc-*`,
 * `*-module__*`) freely. These helpers prefer semantic hooks — element ids,
 * aria/title attributes, href shapes, octicon names, and embedded JSON
 * payloads — and keep legacy selectors as dual-mode fallbacks.
 *
 * All functions take an explicit `Document` so the fixture tests in
 * `src/content/__tests__` can exercise them against saved HTML.
 */

/** Minimal structural fetch type; keeps the API layer stub-friendly. */
export type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export type LicenseSource = "payload" | "dom" | "legacy" | "api" | "none";

const MILLISECONDS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

export interface LicenseDetectionResult {
  hasLicense: boolean;
  hasAmbiguousLicense: boolean;
  source: LicenseSource;
}

export interface LicenseDetectionOptions {
  fetchImpl?: FetchLike;
  owner?: string;
  repo?: string;
}

export interface HydrationSignals {
  commitDateCount: number;
  contributorCount: number;
}

/* ------------------------------------------------------------------ */
/* Filename matching                                                    */
/* ------------------------------------------------------------------ */

function filenameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Case-insensitive fuzzy match for license filenames: `licen[cs]e`,
 * `copying`, `unlicen[cs]e`, compound names (`LICENSE-MIT`, `MIT-LICENSE`),
 * any extension or none.
 */
export function isLicenseFilename(name: string): boolean {
  return filenameTokens(name).some(
    (token) =>
      token.includes("license") ||
      token.includes("licence") ||
      token.startsWith("copying")
  );
}

export function isReadmeFilename(name: string): boolean {
  return filenameTokens(name)[0] === "readme";
}

export function isDocsFilename(name: string): boolean {
  return filenameTokens(name).some(
    (token) => token === "docs" || token === "documentation"
  );
}

/* ------------------------------------------------------------------ */
/* Embedded JSON payloads                                               */
/* ------------------------------------------------------------------ */

/**
 * Parses every `<script type="application/json">` payload in the document.
 * Unparseable scripts are skipped, never thrown.
 */
export function collectJsonPayloads(doc: Document): unknown[] {
  const payloads: unknown[] = [];
  doc
    .querySelectorAll('script[type="application/json"]')
    .forEach((script) => {
      const text = script.textContent;
      if (!text) {
        return;
      }
      try {
        payloads.push(JSON.parse(text));
      } catch {
        // Unknown/malformed payload shapes are ignored on purpose.
      }
    });
  return payloads;
}

interface PayloadRecord {
  [key: string]: unknown;
}

function visitObjects(
  value: unknown,
  visit: (record: PayloadRecord) => boolean | void
): boolean {
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (visitObjects(entry, visit)) {
        return true;
      }
    }
    return false;
  }
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record = value as PayloadRecord;
  if (visit(record)) {
    return true;
  }
  for (const entry of Object.values(record)) {
    if (visitObjects(entry, visit)) {
      return true;
    }
  }
  return false;
}

function isFileListEntry(
  record: PayloadRecord
): record is PayloadRecord & { name: string } {
  return (
    typeof record.name === "string" &&
    (typeof record.path === "string" || typeof record.contentType === "string")
  );
}

/** File-list names found anywhere inside the embedded payloads (recursive). */
export function findPayloadFileNames(doc: Document): string[] {
  const names: string[] = [];
  visitObjects(collectJsonPayloads(doc), (record) => {
    if (isFileListEntry(record)) {
      names.push(record.name);
    }
  });
  return names;
}

export interface PayloadLicense {
  spdxId: string | null;
  name: string | null;
}

/** License object embedded in the sidebar/repo payload, if any. */
export function findPayloadLicense(doc: Document): PayloadLicense | null {
  let found: PayloadLicense | null = null;
  visitObjects(collectJsonPayloads(doc), (record) => {
    const license = record.license;
    if (license === null || typeof license !== "object" || Array.isArray(license)) {
      return false;
    }
    const licenseRecord = license as PayloadRecord;
    const spdxId =
      typeof licenseRecord.spdxId === "string"
        ? licenseRecord.spdxId
        : typeof licenseRecord.spdx_id === "string"
          ? licenseRecord.spdx_id
          : null;
    const name =
      typeof licenseRecord.name === "string" ? licenseRecord.name : null;
    if (!spdxId && !name) {
      return false;
    }
    found = { spdxId, name };
    return true;
  });
  return found;
}

export interface PayloadSidebarSections {
  releaseCount: number | null;
  sponsors: boolean | null;
}

/** Sidebar section data (`sections.releases.releaseCount`, `sections.sponsors`). */
export function getPayloadSidebarSections(
  doc: Document
): PayloadSidebarSections {
  let found: PayloadSidebarSections | null = null;
  visitObjects(collectJsonPayloads(doc), (record) => {
    const sections = record.sections;
    if (sections === null || typeof sections !== "object") {
      return false;
    }
    const sectionsRecord = sections as PayloadRecord;
    const releases = sectionsRecord.releases;
    const releaseCount =
      releases !== null &&
      typeof releases === "object" &&
      typeof (releases as PayloadRecord).releaseCount === "number"
        ? ((releases as PayloadRecord).releaseCount as number)
        : null;
    const sponsors =
      typeof sectionsRecord.sponsors === "boolean"
        ? sectionsRecord.sponsors
        : null;
    if (releaseCount === null && sponsors === null) {
      return false;
    }
    found = { releaseCount, sponsors };
    return true;
  });
  return found ?? { releaseCount: null, sponsors: null };
}

/* ------------------------------------------------------------------ */
/* Semantic DOM file list                                               */
/* ------------------------------------------------------------------ */

/** `/owner/repo/blob/<ref>/<name>` or `/owner/repo/tree/<ref>/<name>` → `<name>`. */
function rootNameFromHref(href: string | null): string | null {
  if (!href) {
    return null;
  }
  const match = href.match(
    /^\/[^/]+\/[^/]+\/(?:blob|tree)\/[^/]+\/([^/?#]+)(?:[?#].*)?$/
  );
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Root filenames gathered from both DOM selector generations and hrefs. */
export function getDomFileNames(doc: Document): string[] {
  const names = new Set<string>();

  doc
    .querySelectorAll(".react-directory-row a[title], .Details a[title]")
    .forEach((anchor) => {
      const title = anchor.getAttribute("title");
      if (title) {
        names.add(title);
      }
    });

  doc
    .querySelectorAll('a[href*="/blob/"], a[href*="/tree/"]')
    .forEach((anchor) => {
      const name = rootNameFromHref(anchor.getAttribute("href"));
      if (name) {
        names.add(name);
      }
    });

  return Array.from(names);
}

/**
 * Single source of truth for the repo root file list: embedded payload names
 * plus semantic DOM names, verbatim case, de-duplicated.
 */
export function getRootFileList(doc: Document): string[] {
  return Array.from(
    new Set([...findPayloadFileNames(doc), ...getDomFileNames(doc)])
  );
}

/* ------------------------------------------------------------------ */
/* License detection                                                    */
/* ------------------------------------------------------------------ */

function findLicenseFileName(names: string[]): string | undefined {
  return names.find(isLicenseFilename);
}

function hasLicenseIndicatorInDom(doc: Document): boolean {
  if (
    doc.querySelector(
      '[id^="user-content-license"], [id^="user-content-licence"], ' +
        '[id^="user-content-scroll-license"], [id^="user-content-scroll-licence"]'
    )
  ) {
    return true;
  }
  if (doc.querySelector('a[href*="opensource.org/licenses"]')) {
    return true;
  }
  // Law octicon, no `.Layout-sidebar` required. On the new UI the sidebar and
  // repo nav expose it next to a "MIT license" style label; require license-ish
  // context so unrelated octicon reuse never claims a license.
  return Array.from(doc.querySelectorAll(".octicon-law")).some((icon) => {
    if (icon.closest(".Layout-sidebar")) {
      return true;
    }
    const anchor = icon.closest("a");
    if (!anchor) {
      return false;
    }
    const context = [
      anchor.textContent,
      anchor.getAttribute("href"),
      anchor.getAttribute("title"),
      anchor.getAttribute("aria-label"),
    ]
      .filter(Boolean)
      .join(" ");
    return /licen[cs]e/i.test(context);
  });
}

/** Legacy dual-mode selectors kept for repos still on the old UI. */
function hasLegacyLicenseSelector(doc: Document): boolean {
  if (doc.querySelector(".Layout-sidebar .octicon-law")) {
    return true;
  }
  return Array.from(doc.querySelectorAll(".Details a[title]")).some((anchor) =>
    isLicenseFilename(anchor.getAttribute("title") || "")
  );
}

function resolveRepoFromDocument(
  doc: Document,
  options: LicenseDetectionOptions
): { owner: string; repo: string } | null {
  if (options.owner && options.repo) {
    return { owner: options.owner, repo: options.repo };
  }
  const pathname = doc.defaultView?.location?.pathname ?? "";
  const match = pathname.match(/^\/([^/]+)\/([^/]+)\/?$/);
  if (!match) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

function licenseResultFromPayload(
  payloadLicense: PayloadLicense
): LicenseDetectionResult {
  if (payloadLicense.spdxId === "NOASSERTION") {
    return { hasLicense: true, hasAmbiguousLicense: true, source: "payload" };
  }
  return { hasLicense: true, hasAmbiguousLicense: false, source: "payload" };
}

async function fetchLicenseFromApi(
  doc: Document,
  options: LicenseDetectionOptions
): Promise<LicenseDetectionResult> {
  const repoRef = resolveRepoFromDocument(doc, options);
  const fetchImpl = options.fetchImpl ?? fetch;
  if (!repoRef) {
    return { hasLicense: false, hasAmbiguousLicense: false, source: "none" };
  }
  try {
    const response = await fetchImpl(
      `https://api.github.com/repos/${repoRef.owner}/${repoRef.repo}`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!response.ok) {
      return { hasLicense: false, hasAmbiguousLicense: false, source: "none" };
    }
    const data = (await response.json()) as {
      license?: { spdx_id?: string | null; name?: string | null } | null;
    } | null;
    const license = data?.license;
    if (!license) {
      return { hasLicense: false, hasAmbiguousLicense: false, source: "api" };
    }
    if (license.spdx_id === "NOASSERTION") {
      return { hasLicense: true, hasAmbiguousLicense: true, source: "api" };
    }
    return { hasLicense: true, hasAmbiguousLicense: false, source: "api" };
  } catch {
    return { hasLicense: false, hasAmbiguousLicense: false, source: "none" };
  }
}

/**
 * Layered license detection: embedded payload → semantic DOM → API fallback.
 * The API layer performs at most one request and only when the DOM layers are
 * exhausted.
 */
export async function checkForLicense(
  doc: Document,
  options: LicenseDetectionOptions = {}
): Promise<LicenseDetectionResult> {
  // L1 — embedded payload.
  const payloadLicense = findPayloadLicense(doc);
  if (payloadLicense) {
    return licenseResultFromPayload(payloadLicense);
  }
  if (findLicenseFileName(findPayloadFileNames(doc))) {
    return { hasLicense: true, hasAmbiguousLicense: false, source: "payload" };
  }

  // L2 — semantic DOM attributes.
  if (findLicenseFileName(getDomFileNames(doc))) {
    return { hasLicense: true, hasAmbiguousLicense: false, source: "dom" };
  }
  if (hasLicenseIndicatorInDom(doc)) {
    return { hasLicense: true, hasAmbiguousLicense: false, source: "dom" };
  }

  // L3 — legacy selectors (dual-mode fallback).
  if (hasLegacyLicenseSelector(doc)) {
    return { hasLicense: true, hasAmbiguousLicense: false, source: "legacy" };
  }

  // L4 — GitHub API fallback.
  return fetchLicenseFromApi(doc, options);
}

/* ------------------------------------------------------------------ */
/* Other file-list checks                                               */
/* ------------------------------------------------------------------ */

export function checkForReadme(doc: Document): boolean {
  return getRootFileList(doc).some(isReadmeFilename);
}

export function checkForDocumentation(doc: Document): boolean {
  return getRootFileList(doc).some(isDocsFilename);
}

/* ------------------------------------------------------------------ */
/* Numeric parsers                                                      */
/* ------------------------------------------------------------------ */

/** Parses "1,234", "1.2k", "57.5k", "256" style display strings. */
export function parseFormattedCount(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }
  const cleaned = text.replace(/,/g, "").replace(/\s+/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([kKmM])?/);
  if (!match) {
    return 0;
  }
  const base = Number.parseFloat(match[1]);
  if (Number.isNaN(base)) {
    return 0;
  }
  const suffix = (match[2] || "").toLowerCase();
  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1;
  return Math.round(base * multiplier);
}

const COMMIT_COUNT_LABEL = /^([\d][\d,.]*\s*[kKmM]?)\s*commits$/i;

/**
 * Commit count from the new-UI "N Commits" button label, the legacy
 * `.octicon-history` + `strong` structure, or the legacy default (1).
 */
export function getCommitCount(doc: Document): number {
  const labelCandidates = [
    ...Array.from(doc.querySelectorAll('a[href*="/commits"]')),
    ...Array.from(doc.querySelectorAll("button, span")),
  ];
  for (const candidate of labelCandidates) {
    const text = (candidate.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length > 32) {
      continue;
    }
    const match = text.match(COMMIT_COUNT_LABEL);
    if (match) {
      return parseFormattedCount(match[1]);
    }
  }

  const historyIcon = doc.querySelector(".octicon-history");
  const container =
    historyIcon?.closest("a, span, div") ?? historyIcon?.parentElement ?? null;
  const strong = container?.querySelector("strong");
  if (strong) {
    return parseFormattedCount(strong.textContent);
  }

  return 1;
}

export function getStars(doc: Document): number {
  const counter = doc.querySelector(
    "#repo-stars-counter-star, #repo-stars-counter-unstar"
  );
  if (counter) {
    return parseFormattedCount(counter.getAttribute("title") || counter.textContent);
  }

  const starButton = doc.querySelector(".js-social-count");
  const socialCount = starButton?.parentElement?.querySelector(".social-count");
  if (socialCount) {
    return parseFormattedCount(
      socialCount.getAttribute("title") || socialCount.textContent
    );
  }

  return 0;
}

export function getIssueCount(doc: Document): number {
  const issueElement = doc.querySelector(
    "#issues-repo-tab-count, .issues-repo-tab-count"
  );
  if (!issueElement) {
    return 0;
  }
  return parseFormattedCount(
    issueElement.getAttribute("title") || issueElement.textContent
  );
}

export function getIssueScore(doc: Document): number {
  const commitCount = getCommitCount(doc);
  const starCount = getStars(doc);
  const issueCount = getIssueCount(doc);

  const issueCommitRatio = commitCount > 0 ? issueCount / commitCount : 0;
  const issueStarRatio = starCount > 0 ? issueCount / starCount : 0;

  return Math.max(issueCommitRatio, issueStarRatio);
}

export function getCommitDateElements(doc: Document): Element[] {
  return Array.from(
    doc.querySelectorAll(
      "relative-time[datetime], time-ago[datetime], time[datetime], .Details [datetime]"
    )
  );
}

export function getHydrationSignals(doc: Document): HydrationSignals {
  return {
    commitDateCount: getCommitDateElements(doc).length,
    contributorCount: getContributorsCount(doc),
  };
}

export function needsHydrationRetry(signals: HydrationSignals): boolean {
  return signals.commitDateCount === 0 || signals.contributorCount === 0;
}

function datetimeElementsToTimestamps(elements: Element[]): number[] {
  return elements
    .map((element) => new Date(element.getAttribute("datetime") || 0).getTime())
    .filter((timestamp) => Number.isFinite(timestamp));
}

export function getMostRecentCommitTime(elements: Element[]): number {
  const timestamps = datetimeElementsToTimestamps(elements);
  return timestamps.length > 0 ? Math.max(...timestamps) : 0;
}

export function getCommitFrequencyScore(elements: Element[]): number {
  const timestamps = datetimeElementsToTimestamps(elements);
  if (timestamps.length === 0) {
    return 0;
  }

  const uniqueCommits = new Set(timestamps);
  const uniqueRatio = uniqueCommits.size / timestamps.length;

  const newestCommit = Math.max(...timestamps);
  const oldestCommit = Math.min(...timestamps);
  const commitDistance = newestCommit - oldestCommit;

  let score = uniqueRatio * 0.5;
  if (commitDistance > MILLISECONDS_PER_YEAR * 3) {
    score += 0.25;
  }
  return Math.min(score, 1);
}

/* ------------------------------------------------------------------ */
/* Sidebar / header signals                                             */
/* ------------------------------------------------------------------ */

export function getAuthorName(doc: Document): string {
  const authorLinkElement = doc.querySelector('.author a[rel="author"]');
  return authorLinkElement?.innerHTML || "";
}

export function getRepoName(doc: Document): string {
  const repoNameLinkElement = doc.querySelector(
    '#repository-container-header strong[itemprop="name"] a'
  );
  return repoNameLinkElement?.innerHTML || "";
}

export function getContributorsCount(doc: Document): number {
  const contributorsElement = doc.querySelector(
    'a[href*="/graphs/contributors"]'
  );
  if (!contributorsElement) {
    return 0;
  }

  // Legacy UI: link with a `.Counter` child.
  const countElement = contributorsElement.querySelector(".Counter");
  if (countElement) {
    return parseFormattedCount(
      countElement.getAttribute("title") || countElement.textContent
    );
  }

  // New UI: CounterLabel beside the "Contributors" heading link.
  const heading = contributorsElement.closest(
    "h2, h3, h4, [class*='sectionHeading'], [class*='SectionHeading']"
  );
  const counterLabel = (
    heading ?? contributorsElement.parentElement
  )?.querySelector(
    '[data-component="CounterLabel"], [class*="CounterLabel"]'
  );
  return parseFormattedCount(
    counterLabel?.getAttribute("title") || counterLabel?.textContent
  );
}

export function checkForReleases(doc: Document): boolean {
  const sections = getPayloadSidebarSections(doc);
  if (sections.releaseCount !== null) {
    return sections.releaseCount > 5;
  }

  let highestCount = 0;
  doc.querySelectorAll('a[href*="/releases"]').forEach((link) => {
    const counterElement = link.querySelector(".Counter");
    if (counterElement) {
      highestCount = Math.max(
        highestCount,
        parseFormattedCount(
          counterElement.getAttribute("title") || counterElement.textContent
        )
      );
    }
  });
  return highestCount > 5;
}

export function checkForSponsorButton(doc: Document): boolean {
  if (doc.querySelector(".icon-sponsor")) {
    return true;
  }
  const sections = getPayloadSidebarSections(doc);
  return sections.sponsors === true;
}

export function checkForCommitBuildPassing(doc: Document): boolean {
  // Legacy UI: build statuses beside the latest commit in the file list.
  if (doc.querySelector(".commit-build-statuses .octicon-check")) {
    return true;
  }
  // New UI: checks status badge button on the latest commit row.
  const checksBadge = doc.querySelector(
    '[data-testid="checks-status-badge-icon"]'
  );
  return !!checksBadge?.querySelector(".octicon-check");
}
