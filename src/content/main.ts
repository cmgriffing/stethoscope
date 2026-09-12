import { cloneDeep } from "lodash";
import browser from "webextension-polyfill";
import { createScoreDetails, defaultScoreConfig } from "../data";
import { MessageEventName, ScoreDetails } from "../types";
import {
  checkForCommitBuildPassing,
  checkForDocumentation,
  checkForLicense,
  checkForReadme,
  checkForReleases,
  checkForSponsorButton,
  getAuthorName,
  getCommitCount,
  getCommitDateElements,
  getCommitFrequencyScore,
  getContributorsCount,
  getHydrationSignals,
  getIssueScore,
  getMostRecentCommitTime,
  getRepoName,
  getStars,
  needsHydrationRetry,
  type LicenseDetectionResult,
} from "./detection";
import { createRetryScheduler } from "./hydration";

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
const HYDRATION_RETRY_DELAY_MS = 1500;
const MAX_HYDRATION_RETRIES = 3;

let scoreConfig = cloneDeep(defaultScoreConfig);

const hydrationRetryScheduler = createRetryScheduler({
  maxRetries: MAX_HYDRATION_RETRIES,
  delayMs: HYDRATION_RETRY_DELAY_MS,
});

/**
 * License detection is page-scoped: the DOM layers and the one-shot API
 * fallback run once, then re-scoring reuses the result. Inconclusive results
 * (no DOM evidence and no usable API response) are retried by later runs.
 */
let licenseDetection: Promise<LicenseDetectionResult> | null = null;

function getLicenseDetection(): Promise<LicenseDetectionResult> {
  if (!licenseDetection) {
    licenseDetection = checkForLicense(document).then((result) => {
      if (!result.hasLicense && result.source === "none") {
        licenseDetection = null;
      }
      return result;
    });
  }
  return licenseDetection;
}

browser.runtime.onMessage.addListener(function (request: any, _sender: any) {
  if (request.eventName === MessageEventName.ConfigChanged) {
    scoreConfig = request.scoreConfig;
  }

  hydrationRetryScheduler.reset();
  getScore().catch(console.log);
});

browser.runtime.sendMessage({
  eventName: MessageEventName.ConfigRequested,
});

function isValidRepoPage(): boolean {
  return (
    window.location.pathname.split("/").filter((section) => section !== "")
      .length === 2
  );
}

function sendScore(score: ScoreDetails) {
  browser.runtime.sendMessage(undefined, {
    eventName: MessageEventName.ScoreCalculated,
    score,
  });
}

async function getScore() {
  // check if we should even be scoring this page
  if (!isValidRepoPage()) {
    // do nothing
    return;
  }

  const score = createScoreDetails();

  score.authorName = getAuthorName(document);
  score.repoName = getRepoName(document);

  const licenseResult = await getLicenseDetection();
  score.hasLicense = licenseResult.hasLicense;
  score.hasAmbiguousLicense = licenseResult.hasAmbiguousLicense;

  if (licenseResult.hasLicense) {
    if (checkForReadme(document) && scoreConfig.values.readme.enabled) {
      score.scores.readme.value = 1;
      score.scores.readme.score = score.scores.readme.maxScore;
    }

    const modifiedDatesElements = getCommitDateElements(document);

    const mostRecentCommit = getMostRecentCommitTime(modifiedDatesElements);

    const timeSinceCommit = Date.now() - mostRecentCommit;
    const percentageOfYear = timeSinceCommit / MILLISECONDS_PER_YEAR;
    if (mostRecentCommit > 0 && percentageOfYear < 1) {
      score.scores.mostRecentCommit.value = mostRecentCommit;
      score.scores.mostRecentCommit.score =
        score.scores.mostRecentCommit.maxScore * (1 - percentageOfYear);
    }

    const contributorCount = getContributorsCount(document);
    if (contributorCount > 5) {
      score.scores.amountOfContributors.value = contributorCount;
      score.scores.amountOfContributors.score =
        score.scores.amountOfContributors.maxScore;
    }

    if (checkForReleases(document)) {
      score.scores.releases.value = 1;
      score.scores.releases.score = score.scores.releases.maxScore;
    }

    const commitCount = getCommitCount(document);
    if (commitCount > 100) {
      score.scores.amountOfCommits.value = commitCount;
      score.scores.amountOfCommits.score =
        score.scores.amountOfCommits.maxScore;
    }

    const stars = getStars(document);
    if (stars > 100) {
      score.scores.stars.value = stars;
      score.scores.stars.score = score.scores.stars.maxScore;
    }

    if (checkForSponsorButton(document)) {
      score.scores.sponsors.value = 1;
      score.scores.sponsors.score = score.scores.sponsors.maxScore;
    }

    if (checkForDocumentation(document)) {
      score.scores.docsFolder.value = 1;
      score.scores.docsFolder.score = score.scores.docsFolder.maxScore;
    }

    if (checkForCommitBuildPassing(document)) {
      score.scores.buildPassing.value = 1;
      score.scores.buildPassing.score = score.scores.buildPassing.maxScore;
    }

    if (getCommitFrequencyScore(modifiedDatesElements) > 0.75) {
      score.scores.commitFrequency.value = 1;
      score.scores.commitFrequency.score =
        score.scores.commitFrequency.maxScore;
    }

    if (getIssueScore(document) <= 0.08) {
      score.scores.openIssues.value = 1;
      score.scores.openIssues.score = score.scores.openIssues.maxScore;
    }
  } else {
    // immediate fail
    console.log("No License");
  }

  sendScore(score);

  // Late-hydrating signals (commit dates, contributor counts) may not be
  // present yet; schedule a bounded re-score so the final score uses them.
  // Only licensed repos produce a score worth refining.
  if (licenseResult.hasLicense) {
    const signals = getHydrationSignals(document);
    if (needsHydrationRetry(signals)) {
      hydrationRetryScheduler.schedule(() => {
        getScore().catch(console.log);
      });
    }
  }
}

export {};
