import { describe, expect, it } from "vitest";
import { loadFixtureDocument } from "./fixtures";

describe("fixture harness", () => {
  it("loads the legacy fixture with old-UI markers", () => {
    const doc = loadFixtureDocument("legacy");

    expect(doc.querySelector(".Details")).not.toBeNull();
    expect(doc.querySelector(".Layout-sidebar")).not.toBeNull();
    expect(doc.querySelector(".react-directory-row")).toBeNull();
    expect(doc.querySelector('[id^="react-app.embeddedData"]')).toBeNull();
  });

  it("loads the new-UI fixture with React code-view markers", () => {
    const doc = loadFixtureDocument("new-ui");

    expect(doc.querySelector(".react-directory-row")).not.toBeNull();
    expect(doc.querySelector(".Layout-sidebar")).toBeNull();
    expect(doc.querySelector('script[type="application/json"]')).not.toBeNull();
  });

  it("parses the new-UI embedded JSON payload", () => {
    const doc = loadFixtureDocument("new-ui");
    const scripts = Array.from(
      doc.querySelectorAll('script[type="application/json"]')
    );

    expect(scripts.length).toBeGreaterThan(0);
    expect(() =>
      scripts.forEach((script) => JSON.parse(script.textContent || ""))
    ).not.toThrow();
  });
});
