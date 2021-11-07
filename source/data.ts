import {
  GradeDetails,
  ScoreConfig,
  ScoreConfigValueType,
  ScoreDetails,
  ScoreKey,
} from "./types";

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

export const defaultScoreConfig: ScoreConfig = {
  modifiedDate: 0,
  values: {
    [ScoreKey.stars]: {
      valueType: ScoreConfigValueType.Number,
      value: 5,
      enabled: true,
    },

    [ScoreKey.readme]: {
      valueType: ScoreConfigValueType.Number,
      value: 30,
      enabled: true,
    },

    [ScoreKey.mostRecentCommit]: {
      valueType: ScoreConfigValueType.Number,
      value: 20,
      enabled: true,
    },
    [ScoreKey.amountOfContributors]: {
      valueType: ScoreConfigValueType.Number,
      value: 10,
      enabled: true,
    },
    [ScoreKey.amountOfCommits]: {
      valueType: ScoreConfigValueType.Number,
      value: 15,
      enabled: true,
    },

    [ScoreKey.sponsors]: {
      valueType: ScoreConfigValueType.Number,
      value: 5,
      enabled: true,
    },

    [ScoreKey.releases]: {
      valueType: ScoreConfigValueType.Number,
      value: 5,
      enabled: true,
    },

    [ScoreKey.docsFolder]: {
      valueType: ScoreConfigValueType.Number,
      value: 5,
      enabled: true,
    },

    [ScoreKey.buildPassing]: {
      valueType: ScoreConfigValueType.Number,
      value: 10,
      enabled: true,
    },

    [ScoreKey.commitFrequency]: {
      valueType: ScoreConfigValueType.Number,
      value: 10,
      enabled: true,
    },

    [ScoreKey.openIssues]: {
      valueType: ScoreConfigValueType.Number,
      value: 10,
      enabled: true,
    },
  },
};

export function createScoreDetails(): ScoreDetails {
  const { values } = defaultScoreConfig;

  return {
    repoName: "",
    authorName: "",
    hasLicense: false,
    hasAmbiguousLicense: false,
    scores: {
      stars: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.stars].value,
        label: "Amount of Stars",
      },
      readme: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.readme].value,
        label: "README file exists",
      },
      mostRecentCommit: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.mostRecentCommit].value,
        label: "Most recent commit",
      },
      amountOfContributors: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.amountOfContributors].value,
        label: "Amount of Contributors",
      },
      amountOfCommits: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.amountOfCommits].value,
        label: "Amount of commits",
      },
      sponsors: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.sponsors].value,
        label: "Sponsor section exists",
      },
      releases: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.releases].value,
        label: "Releases section exists",
      },
      docsFolder: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.docsFolder].value,
        label: "Docs folder exists",
      },
      buildPassing: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.buildPassing].value,
        label: "Build passing on recent commit",
      },
      commitFrequency: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.commitFrequency].value,
        label: "Frequency of commits",
      },
      openIssues: {
        value: 0,
        score: 0,
        maxScore: values[ScoreKey.openIssues].value,
        label: "Open issues score",
      },
    },
  };
}
