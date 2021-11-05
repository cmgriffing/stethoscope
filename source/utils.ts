import { gradeDetails } from "./data";
import { ScoreDetails } from "./types";

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

export function getTotalFromScore(score: ScoreDetails) {
	let scoreTotal = 0;

	if (score.hasLicense) {
		Object.entries(score.scores).forEach(([_scoreKey, scoreDetails]) => {
			scoreTotal += scoreDetails.score;
		});
	}

	return scoreTotal;
}
