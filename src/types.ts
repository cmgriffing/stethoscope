export enum MessageEventName {
  ScoreCalculated = "scoreCalculated",
  ScoreRequested = "scoreRequested",
  TabLoaded = "tabLoaded",
  ConfigChanged = "configChanged",
  ConfigRequested = "configRequested",
}

export enum ScoreKey {
  stars = "stars",
  readme = "readme",
  mostRecentCommit = "mostRecentCommit",
  amountOfContributors = "amountOfContributors",
  amountOfCommits = "amountOfCommits",
  sponsors = "sponsors",
  releases = "releases",
  buildPassing = "buildPassing",
  docsFolder = "docsFolder",
  commitFrequency = "commitFrequency",
  openIssues = "openIssues",
}

export enum ScoreConfigValueType {
  Boolean = "boolean",
  Number = "number",
}

export interface ScoreConfig {
  modifiedDate: number;
  values: {
    [value in ScoreKey]: {
      valueType: ScoreConfigValueType;
      value: number;
      enabled: boolean;
    };
  };
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
    [value in ScoreKey]: Score;
  };
}

export interface GradeDetails {
  [key: string]: {
    minimumScore: number;
    color: string;
  };
}
