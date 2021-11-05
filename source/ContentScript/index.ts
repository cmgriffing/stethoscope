import { browser } from "webextension-polyfill-ts";
import { createScoreDetails } from "../data";
import { MessageEventName } from "../types";

/*
- license file - immediate fail if no license
  - or section in readme

  - stars - 5 if above 100
- readme file - 20 (take length into account eventually. (height?, sections? who knows))
- most recent commit - 20 - scaled to within a year
- amount of contributors - 5 - if greater than 5
- amount of commits - 10
- sponsors - 5 if exist
- releases - 5 if recent
- has docs folder - 5 - just for having
- frequency of commits - 10 - check distance between most recent and oldest, check for varied dates between
- open issues - 10 -

- link in about section - 5
  - has prepared docs website - 5 - just for having
- open pull requests - 10 -
- specific readme sections? - 5 - for having a contributing section


Nice to have
- badges (build passing, etc) - -10 - Lose points for a fail
*/
const humanFormat = require("human-format");

const MILLISECONDS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

let loaded = false;

window.addEventListener("load", () => {
	loaded = true;
	getScore();
});

browser.runtime.onMessage.addListener(function (_request: any, _sender: any) {
	console.log("content script on message", { loaded });

	getScore();
	// }
});

async function getScore() {
	const score = createScoreDetails();

	score.authorName = getAuthorName();
	score.repoName = getRepoName();

	if (checkForLicense()) {
		score.hasLicense = true;

		if (checkForReadme()) {
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

		const contributorCount = getContributorsCount();
		if (contributorCount > 5) {
			score.scores.amountOfContributors.value = contributorCount;
			score.scores.amountOfContributors.score =
				score.scores.amountOfContributors.maxScore;
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

		if (checkForSponsorSection()) {
			score.scores.sponsors.value = 1;
			score.scores.sponsors.score = score.scores.sponsors.maxScore;
		}

		if (checkForReleases()) {
			score.scores.releases.value = 1;
			score.scores.releases.score = score.scores.releases.maxScore;
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

		console.log({ score });

		browser.runtime.sendMessage(undefined, {
			eventName: MessageEventName.ScoreCalculated,
			score,
		});
	} else {
		// immediate fail
		console.log("No License");

		browser.runtime.sendMessage(
			undefined,
			{ score }
			//   , function (response: any) {
			// 	console.log("score sent and received", response);
			// }
		);
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

function checkForSponsorSection(): boolean {
	const sponsorSectionResult = document.evaluate(
		'//h2[text()[contains(.,"Sponsor this project")]]',
		document,
		null,
		XPathResult.ANY_UNORDERED_NODE_TYPE
	);

	return !!sponsorSectionResult?.singleNodeValue;
}

function checkForReleases() {
	const releasesSectionResult = document.evaluate(
		'//h2[text()[contains(.,"Releases")]]',
		document,
		null,
		XPathResult.ANY_UNORDERED_NODE_TYPE
	);

	if (!releasesSectionResult) {
		return false;
	} else {
		const releasesSectionElement =
			releasesSectionResult?.singleNodeValue as Element;
		const counterElement = releasesSectionElement?.querySelector(".Counter");

		const counterValue = parseInt(
			scrubNumberString(counterElement?.getAttribute("title") || "0"),
			10
		);

		return counterValue > 5;
	}
}

function getStars() {
	const starButton = document.querySelector(
		'button[aria-label="Star this repository"]'
	);

	const buttonParent = starButton?.parentElement;

	const socialCountElement = buttonParent?.querySelector(".social-count");

	if (socialCountElement) {
		return humanFormat.parse(socialCountElement.innerHTML) || 0;
	}

	return 0;
}

function getCommitCount() {
	const gitStatsResult = document.evaluate(
		'//h2[text()[contains(.,"Git stats")]]',
		document,
		null,
		XPathResult.ANY_UNORDERED_NODE_TYPE
	);

	if (!gitStatsResult) {
		return 1;
	} else {
		const gitStatsElement = gitStatsResult.singleNodeValue;
		const gitStatsParentElement = gitStatsElement?.parentNode as HTMLElement;
		const countElement = gitStatsParentElement?.querySelector("strong");

		return parseInt(scrubNumberString(countElement?.innerText || "0"), 10);
	}
}

function getContributorsCount() {
	const contributorsResult = document.evaluate(
		'//a[text()[contains(.,"Contributors")]]',
		document,
		null,
		XPathResult.ANY_UNORDERED_NODE_TYPE
	);

	if (!contributorsResult) {
		return 0;
	} else {
		const contributorsElement =
			contributorsResult.singleNodeValue as HTMLElement;

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
	const hasLicenseFile = hasAtleastOneSelector(
		[
			"License",
			"LICENSE",
			"Licence",
			"LICENCE",
			"Licenses",
			"LICENSES",
			"Licences",
			"LICENCES",
		].map((title) => `.Details a[title="${title}"]`)
	);

	const hasLicenseSection = hasAtleastOneSelector(
		["license", "licence"].map((title) => `#user-content-${title}`)
	);

	return hasLicenseFile || hasLicenseSection;
}

function checkForReadme() {
	const hasReadme = hasAtleastOneSelector(
		["Readme.md", "README.md", "README.MD", "Readme", "README"].map(
			(title) => `.Details a[title="${title}"]`
		)
	);

	return hasReadme;
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
