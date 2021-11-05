import { GradeDetails, ScoreDetails } from "./types";

export const gradeDetails: GradeDetails = {
	F: {
		minimumScore: 0,
		color: "red",
	},
	D: {
		minimumScore: 60,
		color: "orange",
	},
	C: {
		minimumScore: 70,
		color: "yellow",
	},
	B: {
		minimumScore: 80,
		color: "lightgreen",
	},
	A: {
		minimumScore: 90,
		color: "green",
	},
};

export function createScoreDetails(): ScoreDetails {
	return {
		repoName: "",
		authorName: "",
		hasLicense: false,
		hasAmbiguousLicense: false,
		scores: {
			stars: {
				value: 0,
				score: 0,
				maxScore: 5,
				label: "Amount of Stars",
			},
			readme: {
				value: 0,
				score: 0,
				maxScore: 30,
				label: "README file exists",
			},
			mostRecentCommit: {
				value: 0,
				score: 0,
				maxScore: 20,
				label: "Most recent commit",
			},
			amountOfContributors: {
				value: 0,
				score: 0,
				maxScore: 10,
				label: "Amount of Contributors",
			},
			amountOfCommits: {
				value: 0,
				score: 0,
				maxScore: 15,
				label: "Amount of commits",
			},
			sponsors: {
				value: 0,
				score: 0,
				maxScore: 5,
				label: "Sponsor section exists",
			},
			releases: {
				value: 0,
				score: 0,
				maxScore: 5,
				label: "Releases section exists",
			},
			docsFolder: {
				value: 0,
				score: 0,
				maxScore: 5,
				label: "Docs folder exists",
			},
			buildPassing: {
				value: 0,
				score: 0,
				maxScore: 10,
				label: "Build passing on recent commit",
			},
			commitFrequency: {
				value: 0,
				score: 0,
				maxScore: 10,
				label: "Frequency of commits",
			},
			openIssues: {
				value: 0,
				score: 0,
				maxScore: 10,
				label: "Open issues score",
			},
		},
	};
}
