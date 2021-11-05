import { browser } from "webextension-polyfill-ts";
import { MessageEventName, ScoreDetails } from "../types";
import { getGradeFromScoreTotal, getTotalFromScore } from "../utils";

// S for perfect score

const scores: { [key: number]: ScoreDetails } = {};

browser.runtime.onInstalled.addListener((): void => {});

browser.tabs.onActivated.addListener((activeInfo) => {
	console.log({ activeInfo });
	setTimeout(() => {
		browser.tabs.sendMessage(
			activeInfo.tabId,
			{
				eventName: MessageEventName.TabLoaded,
			},
			undefined
		);
	}, 1000);
});

browser.runtime.onMessage.addListener(function (request: any, sender: any) {
	console.log(
		sender.tab
			? "from a content script:" + sender.tab.url
			: "from the extension"
	);
	console.log({ sender, request });
	if (request.eventName === MessageEventName.ScoreCalculated) {
		scores[sender.tab.id] = request.score;
		setIconBasedOnScore(request.score, sender.tab.id);
		browser.runtime.sendMessage({
			eventName: MessageEventName.ScoreCalculated,
			score: request.score,
		});
	} else if (request.eventName === MessageEventName.ScoreRequested) {
		browser.runtime.sendMessage({
			eventName: MessageEventName.ScoreCalculated,
			score: scores[request.tabId],
		});
	}
	// if (request.greeting == "hello") {
	//   sendResponse({ farewell: "goodbye" });
	// }
});

function setIconBasedOnScore(score: ScoreDetails, tabId: number) {
	const scoreTotal = getTotalFromScore(score);

	const grade = getGradeFromScoreTotal(scoreTotal);

	const canvas = document.createElement("canvas");
	canvas.height = 32;
	canvas.width = 32;
	const renderingContext = canvas.getContext("2d");
	if (renderingContext) {
		renderingContext.fillStyle = grade.color;
		renderingContext.fillRect(0, 0, 32, 32);
		// renderingContext?.ellipse(16, 16, 16, 16, 0, 0, 360);

		browser.browserAction.setIcon({
			tabId,
			imageData: renderingContext?.getImageData(0, 0, 32, 32),
		});
	}
}
