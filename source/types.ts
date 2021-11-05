export enum MessageEventName {
	ScoreCalculated = "scoreCalculated",
	ScoreRequested = "scoreRequested",
	TabLoaded = "tabLoaded",
}

export interface Score {
	value: number;
	score: number;
	maxScore: number;
	label: string;
}

export interface ScoreDetails {
	repoName: string;
	authorName: string;
	hasLicense: boolean;
	hasAmbiguousLicense: boolean;
	scores: {
		stars: Score;
		readme: Score;
		mostRecentCommit: Score;
		amountOfContributors: Score;
		amountOfCommits: Score;
		sponsors: Score;
		releases: Score;
		buildPassing: Score;
		docsFolder: Score;
		commitFrequency: Score;
		openIssues: Score;
	};
}

export interface GradeDetails {
	[key: string]: {
		minimumScore: number;
		color: string;
	};
}
