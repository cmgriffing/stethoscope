import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import {
  checkForCommitBuildPassing,
  checkForDocumentation,
  checkForLicense,
  checkForReadme,
  checkForReleases,
  checkForSponsorButton,
  findPayloadFileNames,
  findPayloadLicense,
  getAuthorName,
  getCommitCount,
  getCommitDateElements,
  getContributorsCount,
  getDomFileNames,
  getHydrationSignals,
  getIssueCount,
  getPayloadSidebarSections,
  getRepoName,
  getRootFileList,
  getStars,
  isLicenseFilename,
  needsHydrationRetry,
  parseFormattedCount,
} from "../detection";
import { loadFixtureDocument } from "./fixtures";

function syntheticDocument(
  body: string,
  url = "https://github.com/owner/repo"
): Document {
  return new JSDOM(`<!DOCTYPE html><html><body>${body}</body></html>`, {
    url,
  }).window.document;
}

function jsonPayloadDocument(payload: unknown): Document {
  return syntheticDocument(
    `<script type="application/json">${JSON.stringify(payload)}</script>`
  );
}

describe("isLicenseFilename", () => {
  it.each([
    "license",
    "LICENSE",
    "Licence",
    "LICENCE",
    "LICENSES",
    "license.md",
    "LICENSE.MD",
    "LICENSE.txt",
    "LICENSE-MIT",
    "MIT-LICENSE.txt",
    "COPYING",
    "COPYING.LESSER",
    "UNLICENSE",
    "UNLICENCE.md",
    "GPL-3.0-LICENSE",
  ])("matches %s", (name) => {
    expect(isLicenseFilename(name)).toBe(true);
  });

  it.each([
    "readme.md",
    "contributing.md",
    "LICENSING.md",
    "docs",
    "package.json",
    "tsconfig.json",
  ])("does not match %s", (name) => {
    expect(isLicenseFilename(name)).toBe(false);
  });
});

describe("parseFormattedCount", () => {
  it.each([
    ["1,234", 1234],
    ["1.2k", 1200],
    ["57.5k", 57500],
    ["3M", 3_000_000],
    ["256", 256],
    ["", 0],
    ["n/a", 0],
  ] as const)("parses %s as %d", (input, expected) => {
    expect(parseFormattedCount(input)).toBe(expected);
  });
});

describe("embedded payload reader", () => {
  it("finds file-list entries recursively", () => {
    const doc = jsonPayloadDocument({
      payload: {
        nested: {
          tree: {
            items: [
              { name: "src", path: "src", contentType: "directory" },
              { name: "license", path: "license", contentType: "file" },
            ],
          },
        },
      },
    });

    expect(findPayloadFileNames(doc)).toEqual(["src", "license"]);
  });

  it("finds the sidebar license object", () => {
    const doc = jsonPayloadDocument({
      payload: { sidebarAbout: { repo: { license: { spdxId: "MIT", name: "MIT License" } } } },
    });

    expect(findPayloadLicense(doc)).toEqual({
      spdxId: "MIT",
      name: "MIT License",
    });
  });

  it("finds sidebar section counts", () => {
    const doc = jsonPayloadDocument({
      payload: { sidebarAbout: { sections: { releases: { releaseCount: 51 }, sponsors: true } } },
    });

    expect(getPayloadSidebarSections(doc)).toEqual({
      releaseCount: 51,
      sponsors: true,
    });
  });

  it("tolerates malformed payloads without throwing", () => {
    const doc = syntheticDocument(
      `<script type="application/json">{not json</script><script type="application/json">{"name":"license","path":"license","contentType":"file"}</script>`
    );

    expect(findPayloadFileNames(doc)).toEqual(["license"]);
  });
});

describe("license detection — new UI fixture", () => {
  it("detects the lowercase license file via the payload layer", async () => {
    const doc = loadFixtureDocument("new-ui");
    const result = await checkForLicense(doc);

    expect(result.hasLicense).toBe(true);
    expect(result.hasAmbiguousLicense).toBe(false);
    expect(result.source).toBe("payload");
  });

  it("detects the license even though no README license section is rendered", async () => {
    const doc = loadFixtureDocument("new-ui");

    expect(doc.querySelector('[id^="user-content-license"]')).toBeNull();
    expect((await checkForLicense(doc)).hasLicense).toBe(true);
  });

  it("includes the license file in the shared root file list", () => {
    const doc = loadFixtureDocument("new-ui");

    expect(getRootFileList(doc)).toContain("license");
    expect(checkForReadme(doc)).toBe(true);
    expect(checkForDocumentation(doc)).toBe(false);
  });
});

describe("license detection — legacy UI fixture", () => {
  it("detects LICENSE.txt via the semantic DOM layer", async () => {
    const doc = loadFixtureDocument("legacy");
    const result = await checkForLicense(doc);

    expect(result.hasLicense).toBe(true);
    expect(result.hasAmbiguousLicense).toBe(false);
    expect(result.source).toBe("dom");
  });

  it("includes LICENSE.txt in the shared root file list", () => {
    const doc = loadFixtureDocument("legacy");

    expect(getRootFileList(doc)).toContain("LICENSE.txt");
    expect(checkForReadme(doc)).toBe(true);
    expect(checkForDocumentation(doc)).toBe(false);
  });
});

describe("license detection — fuzzy filenames", () => {
  it.each([
    "COPYING",
    "COPYING.LESSER",
    "LICENSE-MIT.md",
    "MIT-LICENSE.txt",
    "unlicence",
  ])("detects %s in a legacy file list", async (filename) => {
    const doc = syntheticDocument(
      `<div class="Details"><a title="${filename}" href="/owner/repo/blob/main/${filename}">${filename}</a></div>`
    );
    const result = await checkForLicense(doc);

    expect(result.hasLicense).toBe(true);
    expect(result.source).toBe("dom");
  });

  it("detects a lowercase license in a new-UI row title", async () => {
    const doc = syntheticDocument(
      `<table><tr class="react-directory-row"><td><a title="license" href="/owner/repo/blob/main/license">license</a></td></tr></table>`
    );

    expect((await checkForLicense(doc)).hasLicense).toBe(true);
  });

  it("detects license evidence in a blob href with no title", async () => {
    const doc = syntheticDocument(
      `<a href="/owner/repo/blob/main/LICENSE">LICENSE</a>`
    );

    expect(getDomFileNames(doc)).toContain("LICENSE");
    expect((await checkForLicense(doc)).hasLicense).toBe(true);
  });
});

describe("license detection — API fallback", () => {
  it("performs exactly one request when the DOM layers are exhausted", async () => {
    const fetchStub = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ license: { spdx_id: "MIT", name: "MIT License" } }),
    }));
    const doc = syntheticDocument("<p>no license evidence here</p>");
    const result = await checkForLicense(doc, {
      fetchImpl: fetchStub,
      owner: "owner",
      repo: "repo",
    });

    expect(result).toEqual({
      hasLicense: true,
      hasAmbiguousLicense: false,
      source: "api",
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(fetchStub).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo",
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("derives owner/repo from the page location", async () => {
    const fetchStub = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ license: { spdx_id: "Apache-2.0" } }),
    }));
    const doc = syntheticDocument(
      "<p>no license evidence here</p>",
      "https://github.com/sindresorhus/is"
    );

    await checkForLicense(doc, { fetchImpl: fetchStub });

    expect(fetchStub).toHaveBeenCalledWith(
      "https://api.github.com/repos/sindresorhus/is",
      expect.anything()
    );
  });

  it("maps NOASSERTION to licensed + ambiguous", async () => {
    const fetchStub = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        license: { spdx_id: "NOASSERTION", name: "Other" },
      }),
    }));
    const doc = syntheticDocument("<p>no license evidence here</p>");
    const result = await checkForLicense(doc, {
      fetchImpl: fetchStub,
      owner: "owner",
      repo: "repo",
    });

    expect(result.hasLicense).toBe(true);
    expect(result.hasAmbiguousLicense).toBe(true);
    expect(result.source).toBe("api");
  });

  it("reports no license when the API returns null without further attempts", async () => {
    const fetchStub = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ license: null }),
    }));
    const doc = syntheticDocument("<p>no license evidence here</p>");
    const result = await checkForLicense(doc, {
      fetchImpl: fetchStub,
      owner: "owner",
      repo: "repo",
    });

    expect(result.hasLicense).toBe(false);
    expect(result.hasAmbiguousLicense).toBe(false);
    expect(result.source).toBe("api");
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("never calls the API when the DOM layers succeed", async () => {
    const fetchStub = vi.fn();
    const doc = loadFixtureDocument("legacy");

    await checkForLicense(doc, { fetchImpl: fetchStub });

    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("fails gracefully when the request throws", async () => {
    const fetchStub = vi.fn(async () => {
      throw new Error("network down");
    });
    const doc = syntheticDocument("<p>no license evidence here</p>");
    const result = await checkForLicense(doc, {
      fetchImpl: fetchStub,
      owner: "owner",
      repo: "repo",
    });

    expect(result.hasLicense).toBe(false);
    expect(result.source).toBe("none");
  });

  it("does not fetch when no repo can be resolved", async () => {
    const fetchStub = vi.fn();
    const doc = syntheticDocument("<p>no license</p>", "https://github.com/");

    const result = await checkForLicense(doc, { fetchImpl: fetchStub });

    expect(result.source).toBe("none");
    expect(fetchStub).not.toHaveBeenCalled();
  });
});

describe("commit count parsing", () => {
  it("parses the new-UI button label", () => {
    expect(getCommitCount(loadFixtureDocument("new-ui"))).toBe(256);
  });

  it("parses the legacy .octicon-history structure", () => {
    expect(getCommitCount(loadFixtureDocument("legacy"))).toBe(6614);
  });

  it("scrubs formatted numbers in the new structure", () => {
    const doc = syntheticDocument(
      `<a href="/owner/repo/commits/main"><span>1,234 Commits</span></a>`
    );

    expect(getCommitCount(doc)).toBe(1234);
  });

  it("parses abbreviated numbers in the new structure", () => {
    const doc = syntheticDocument(
      `<a href="/owner/repo/commits/main"><span>1.2k Commits</span></a>`
    );

    expect(getCommitCount(doc)).toBe(1200);
  });

  it("falls back to the legacy strong element", () => {
    const doc = syntheticDocument(
      `<div><svg class="octicon octicon-history"></svg><strong>2,048</strong></div>`
    );

    expect(getCommitCount(doc)).toBe(2048);
  });

  it("returns the legacy default when nothing is found", () => {
    expect(getCommitCount(syntheticDocument("<p>empty</p>"))).toBe(1);
  });
});

describe("other fixture-based checks (both UI generations)", () => {
  it("finds stars on both fixtures", () => {
    expect(getStars(loadFixtureDocument("new-ui"))).toBe(1793);
    expect(getStars(loadFixtureDocument("legacy"))).toBe(57510);
  });

  it("finds issue counts on both fixtures", () => {
    expect(getIssueCount(loadFixtureDocument("new-ui"))).toBe(0);
    expect(getIssueCount(loadFixtureDocument("legacy"))).toBe(69);
  });

  it("finds author and repo names on both fixtures", () => {
    expect(getAuthorName(loadFixtureDocument("new-ui"))).toContain(
      "sindresorhus"
    );
    expect(getRepoName(loadFixtureDocument("new-ui"))).toContain("is");
    expect(getAuthorName(loadFixtureDocument("legacy"))).toContain("jquery");
    expect(getRepoName(loadFixtureDocument("legacy"))).toContain("jquery");
  });

  it("finds releases on both fixtures", () => {
    expect(checkForReleases(loadFixtureDocument("new-ui"))).toBe(true);
    expect(checkForReleases(loadFixtureDocument("legacy"))).toBe(true);
  });

  it("finds the sponsor section on the new-UI fixture", () => {
    expect(checkForSponsorButton(loadFixtureDocument("new-ui"))).toBe(true);
    expect(checkForSponsorButton(loadFixtureDocument("legacy"))).toBe(false);
  });

  it("finds no build status on either fixture (not SSR'd)", () => {
    expect(checkForCommitBuildPassing(loadFixtureDocument("new-ui"))).toBe(
      false
    );
    expect(checkForCommitBuildPassing(loadFixtureDocument("legacy"))).toBe(
      false
    );
  });

  it("counts contributors on the legacy fixture only (new UI hydrates late)", () => {
    expect(getContributorsCount(loadFixtureDocument("legacy"))).toBe(282);
    expect(getContributorsCount(loadFixtureDocument("new-ui"))).toBe(0);
  });

  it("parses the hydrated new-UI contributors heading", () => {
    // Shape observed in a hydrated new-UI page (not present in the SSR fixture).
    const doc = syntheticDocument(`
      <h2 class="SidebarSection-module__sectionHeading__abc">
        <span class="SidebarSection-module__headingLinkWrapper__abc">
          <a href="/owner/repo/graphs/contributors"><span>Contributors</span></a>
          <span data-component="CounterLabel" aria-hidden="true">51</span>
        </span>
      </h2>
    `);

    expect(getContributorsCount(doc)).toBe(51);
  });

  it("detects the hydrated new-UI checks status badge", () => {
    // Shape observed in a hydrated new-UI page (not present in the SSR fixture).
    const passing = syntheticDocument(`
      <button data-testid="checks-status-badge-icon">
        <svg class="octicon octicon-check"></svg>
      </button>
    `);
    const failing = syntheticDocument(`
      <button data-testid="checks-status-badge-icon">
        <svg class="octicon octicon-x"></svg>
      </button>
    `);

    expect(checkForCommitBuildPassing(passing)).toBe(true);
    expect(checkForCommitBuildPassing(failing)).toBe(false);
  });
});

describe("hydration signals", () => {
  it("flags missing commit dates and contributors for retry", () => {
    const newUiSignals = getHydrationSignals(loadFixtureDocument("new-ui"));

    expect(newUiSignals.commitDateCount).toBe(0);
    expect(needsHydrationRetry(newUiSignals)).toBe(true);
  });

  it("does not flag the legacy fixture (dates are server-rendered)", () => {
    const legacySignals = getHydrationSignals(loadFixtureDocument("legacy"));

    expect(legacySignals.commitDateCount).toBe(2);
    expect(getCommitDateElements(loadFixtureDocument("legacy")).length).toBe(2);
  });

  it("does not retry when both signals are present", () => {
    expect(
      needsHydrationRetry({ commitDateCount: 2, contributorCount: 10 })
    ).toBe(false);
  });
});
