import { cloneDeep, capitalize } from "lodash";
import browser from "webextension-polyfill";
import { createScoreDetails, defaultScoreConfig } from "../data";
import { MessageEventName } from "../types";
import humanFormat from "human-format";

/*

  Ideas for criteria:

    - link in about section - 5
      - has prepared docs website - 5 - just for having
    - open pull requests - 10 -
    - specific readme sections? - 5 - for having a contributing section


    Nice to have
    - badges (build passing, etc) - -10 - Lose points for a fail
*/

console.log("Launching content script");

const MILLISECONDS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

let scoreConfig = cloneDeep(defaultScoreConfig);

browser.runtime.onMessage.addListener(function (request: any, _sender: any) {
  if (request.eventName === MessageEventName.ConfigChanged) {
    scoreConfig = request.scoreConfig;
  }

  getScore().catch(console.log);
});

browser.runtime.sendMessage({
  eventName: MessageEventName.ConfigRequested,
});

async function getScore() {
  //check if we should even be scoring this page
  const isValidUrl =
    window.location.pathname.split("/").filter((section) => section !== "")
      .length === 2;

  if (!isValidUrl) {
    // do nothing
    return;
  }

  const score = createScoreDetails();

  score.authorName = getAuthorName();
  score.repoName = getRepoName();

  if (checkForLicense()) {
    score.hasLicense = true;

    if (checkForReadme() && scoreConfig.values.readme.enabled) {
      score.scores.readme.value = 1;
      score.scores.readme.score = score.scores.readme.maxScore;
    }

    const modifiedDatesElements = Array.from(
      document.querySelectorAll(".Details time-ago")
    );

    const mostRecentCommit = getMostRecentCommitTime(modifiedDatesElements);

    const timeSinceCommit = Date.now() - mostRecentCommit;
    const percentageOfYear = timeSinceCommit / MILLISECONDS_PER_YEAR;
    if (percentageOfYear < 1) {
      score.scores.mostRecentCommit.value = mostRecentCommit;
      score.scores.mostRecentCommit.score =
        score.scores.mostRecentCommit.maxScore * (1 - percentageOfYear);
    }

    const sidebarLinks = getAllSidebarLinks();

    const contributorCount = getContributorsCount(sidebarLinks);
    if (contributorCount > 5) {
      score.scores.amountOfContributors.value = contributorCount;
      score.scores.amountOfContributors.score =
        score.scores.amountOfContributors.maxScore;
    }

    if (checkForReleases(sidebarLinks)) {
      score.scores.releases.value = 1;
      score.scores.releases.score = score.scores.releases.maxScore;
    }

    const commitCount = getCommitCount();
    if (commitCount > 100) {
      score.scores.amountOfCommits.value = commitCount;
      score.scores.amountOfCommits.score =
        score.scores.amountOfCommits.maxScore;
    }

    let stars = getStars();
    if (stars > 100) {
      score.scores.stars.value = stars;
      score.scores.stars.score = score.scores.stars.maxScore;
    }

    if (checkForSponsorButton()) {
      score.scores.sponsors.value = 1;
      score.scores.sponsors.score = score.scores.sponsors.maxScore;
    }

    if (checkForDocumentation()) {
      score.scores.docsFolder.value = 1;
      score.scores.docsFolder.score = score.scores.docsFolder.maxScore;
    }

    if (checkForCommitBuildPassing()) {
      score.scores.buildPassing.value = 1;
      score.scores.buildPassing.score = score.scores.buildPassing.maxScore;
    }

    if (getCommitFrequencyScore(modifiedDatesElements) > 0.75) {
      score.scores.commitFrequency.value = 1;
      score.scores.commitFrequency.score =
        score.scores.commitFrequency.maxScore;
    }

    if (getIssueScore() <= 0.08) {
      score.scores.openIssues.value = 1;
      score.scores.openIssues.score = score.scores.openIssues.maxScore;
    }

    browser.runtime.sendMessage(undefined, {
      eventName: MessageEventName.ScoreCalculated,
      score,
    });
  } else {
    // immediate fail
    console.log("No License");
    browser.runtime.sendMessage(undefined, {
      eventName: MessageEventName.ScoreCalculated,
      score,
    });
  }
}

function getAuthorName() {
  const authorLinkElement = document.querySelector('.author a[rel="author"]');
  return authorLinkElement?.innerHTML || "";
}

function getRepoName() {
  const repoNameLinkElement = document.querySelector(
    '#repository-container-header strong[itemprop="name"] a'
  );
  return repoNameLinkElement?.innerHTML || "";
}

function getIssueScore() {
  const commitCount = getCommitCount();
  const starCount = getStars();

  const issueCountElement = document.querySelector(".issues-repo-tab-count");
  const issueCountString = issueCountElement?.getAttribute("title") || "0";
  const issueCount = humanFormat.parse(issueCountString);

  let issueCommitRatio = 0;
  if (commitCount > 0) {
    issueCommitRatio = issueCount / commitCount;
  }
  let issueStarRatio = 0;
  if (starCount) {
    issueStarRatio = issueCount / starCount;
  }

  return Math.max(issueCommitRatio, issueStarRatio);
}

function getCommitFrequencyScore(modifiedDatesElements: Element[]) {
  const sortedModifiedDates = [...modifiedDatesElements].map((element) =>
    new Date(element.getAttribute("datetime") || 0).getTime()
  );

  const uniqueCommitsSet = new Set(sortedModifiedDates);
  const uniqueCommits = Array.from(uniqueCommitsSet.values());

  const uniqueRatio = uniqueCommits.length / sortedModifiedDates.length;

  const newestCommit = Math.max(...sortedModifiedDates);
  const oldestCommit = Math.min(...sortedModifiedDates);

  const commitDistance = newestCommit - oldestCommit;

  let score = uniqueRatio * 0.5;

  if (commitDistance > MILLISECONDS_PER_YEAR * 3) {
    score += 0.25;
  }
  return Math.min(score, 1);
}

function checkForCommitBuildPassing() {
  return !!document.querySelector(".commit-build-statuses .octicon-check");
}

function checkForDocumentation() {
  return hasAtleastOneSelector(
    ["documentation", "docs", "Documentation", "Docs"].map(
      (title) => `.Details a[title="${title}"]`
    )
  );
}

function checkForSponsorButton(): boolean {
  return !!document.querySelector(".icon-sponsor");
}

function checkForReleases(sidebarLinks: HTMLAnchorElement[]) {
  const releasesElement = sidebarLinks.filter((link) => {
    return link.href.indexOf("/releases") > 0;
  })[0];

  if (!releasesElement) {
    return false;
  } else {
    const counterElement = releasesElement?.querySelector(".Counter");

    const counterValue = parseInt(
      scrubNumberString(counterElement?.getAttribute("title") || "0"),
      10
    );

    return counterValue > 5;
  }
}

function getStars() {
  const starButton = document.querySelector(".js-social-count");

  const buttonParent = starButton?.parentElement;

  let socialCountElement = buttonParent?.querySelector(".social-count");

  if (!socialCountElement) {
    socialCountElement =
      document.querySelector("#repo-stars-counter-unstar") ||
      document.querySelector("#repo-stars-counter-star");
  }
  if (socialCountElement) {
    return humanFormat.parse(socialCountElement.innerHTML) || 0;
  }

  return 0;
}

function getCommitCount() {
  const gitStatsResult = document.querySelector(".octicon-history");

  if (!gitStatsResult) {
    return 1;
  } else {
    const gitStatsParentElement = gitStatsResult.parentElement;
    const countElement = gitStatsParentElement?.querySelector("strong");

    return parseInt(scrubNumberString(countElement?.innerText || "0"), 10);
  }
}

function getContributorsCount(sidebarLinks: HTMLAnchorElement[]) {
  const contributorsElement = sidebarLinks.filter((link) => {
    return link.href.indexOf("/graphs/contributors") > 0;
  })[0];

  if (!contributorsElement) {
    return 0;
  } else {
    const countElement = contributorsElement?.querySelector(".Counter");
    const scrubbedNumber = scrubNumberString(
      countElement?.getAttribute("title") || "0"
    );
    return parseInt(scrubbedNumber, 10);
  }
}

function getMostRecentCommitTime(modifiedDatesElements: Element[]) {
  const sortedModifiedDates = [...modifiedDatesElements].map((element) =>
    new Date(element.getAttribute("datetime") || 0).getTime()
  );

  return Math.max(...sortedModifiedDates);
}

function checkForLicense() {
  const rawFilenames = [
    "License",
    "LICENSE",
    "Licence",
    "LICENCE",
    "Licenses",
    "LICENSES",
    "Licences",
    "LICENCES",
    "COPYING",
  ];

  const markdownFilenames = rawFilenames.map((filename) => `${filename}.md`);

  const capitalizedMarkdownFilenames = rawFilenames.map(
    (filename) => `${filename}.MD`
  );

  const rstFilenames = rawFilenames.map((filename) => `${filename}.rst`);

  const capitalizedRstFilenames = rawFilenames.map(
    (filename) => `${filename}.RST`
  );

  const txtFilenames = rawFilenames.map((filename) => `${filename}.txt`);

  const capitalizedTxtFilenames = rawFilenames.map(
    (filename) => `${filename}.TXT`
  );

  const hasLicenseFile = hasAtleastOneSelector(
    [
      rawFilenames,
      markdownFilenames,
      capitalizedMarkdownFilenames,
      rstFilenames,
      capitalizedRstFilenames,
      txtFilenames,
      capitalizedTxtFilenames,
    ].map((title) => `.Details a[title="${title}"]`)
  );

  const hasLicenseSectionInReadme = hasAtleastOneSelector(
    ["license", "licence", "scroll-license", "scroll-licence"].map(
      (title) => `#user-content-${title}`
    )
  );

  const hasLicenseSectionInSidebar = hasAtleastOneSelector([
    ".Layout-sidebar .octicon-law",
  ]);

  let hasLicenseLink = Array.from(document.querySelectorAll("a")).some(
    (link) => {
      const href = link.getAttribute("href");
      if (href) {
        return href.indexOf("https://opensource.org/licenses") > -1;
      } else {
        return false;
      }
    }
  );

  return (
    hasLicenseFile ||
    hasLicenseSectionInReadme ||
    hasLicenseSectionInSidebar ||
    hasLicenseLink
  );
}

function checkForReadme() {
  const selectors: string[] = [];
  const filenames = ["readme", "Readme", "README", "ReadMe"];
  const lowercaseExtensions = [
    "",
    ".md",
    ".markdown",
    ".mdown",
    ".mkdn",
    ".textile",
    ".rdoc",
    ".org",
    ".creole",
    ".mediawiki",
    ".wiki",
    ".rst",
    ".asciidoc",
    ".adoc",
    ".asc",
    ".pod",
  ];

  const capitalizedExtensions = lowercaseExtensions.map(capitalize);

  const uppercaseExtensions = lowercaseExtensions.map((extension) =>
    extension.toUpperCase()
  );

  const extensions = [
    ...lowercaseExtensions,
    ...capitalizedExtensions,
    ...uppercaseExtensions,
  ];

  filenames.forEach((filename) => {
    extensions.forEach((extension) => {
      selectors.push(`${filename}${extension}`);
    });
  });

  const hasReadme = hasAtleastOneSelector(
    selectors.map((title) => `.Details a[title="${title}"]`)
  );

  return hasReadme;
}

function getAllSidebarLinks(): HTMLAnchorElement[] {
  const links = Array.from(document.querySelectorAll(".Layout-sidebar a")).map(
    (linkNode) => linkNode as HTMLAnchorElement
  );
  return links;
}

function hasAtleastOneSelector(selectors: string[]) {
  return selectors.some((selector) => {
    return !!document.querySelector(selector);
  });
}

function scrubNumberString(stringValue: string) {
  return stringValue.replace(new RegExp("[^\\d]", "gm"), "");
}

export {};
