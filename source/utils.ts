import { gradeDetails } from "./data";
import { ScoreConfig, ScoreDetails, ScoreKey } from "./types";

export function getGradeFromScoreTotal(scoreTotal: number) {
  let grade = "F";
  let gradeColor = "red";
  Object.entries(gradeDetails).forEach(([gradeKey, gradeDetail]) => {
    if (scoreTotal >= gradeDetail.minimumScore) {
      grade = gradeKey;
      gradeColor = gradeDetail.color;
    }
  });

  return {
    color: gradeColor,
    letter: grade,
  };
}

export function getTotalFromScore(
  score: ScoreDetails,
  scoreConfig: ScoreConfig,
  scoreTotal = 0
) {
  let maxPossibleScore = 0;
  if (scoreTotal === 0) {
    Object.entries(score.scores).forEach(([scoreKey, scoreDetails]) => {
      const scoreConfigDetails = scoreConfig.values[scoreKey as ScoreKey];
      if (scoreConfigDetails.enabled) {
        scoreTotal += scoreDetails.score;
        maxPossibleScore += scoreConfigDetails.value;
      }
    });
  }
  if (!score.hasLicense) {
    scoreTotal = 0;
  }
  console.log({ scoreTotal, maxPossibleScore });

  maxPossibleScore = Math.min(100, maxPossibleScore);

  let adjustedScore = 100;
  if (maxPossibleScore > 0) {
    adjustedScore = (scoreTotal / maxPossibleScore) * 100;
  }

  return adjustedScore;
}
