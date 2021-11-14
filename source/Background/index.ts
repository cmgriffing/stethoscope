import { browser } from "webextension-polyfill-ts";
import { defaultScoreConfig } from "../data";
import { MessageEventName, ScoreDetails } from "../types";
import { getGradeFromScoreTotal, getTotalFromScore } from "../utils";
import { cloneDeep } from "lodash";

const scores: { [key: number]: ScoreDetails } = {};

let scoreConfig = cloneDeep(defaultScoreConfig);

browser.runtime.onInstalled.addListener((): void => {});

browser.tabs.onActivated.addListener((activeInfo) => {
  setTimeout(() => {
    browser.tabs
      .sendMessage(
        activeInfo.tabId,
        {
          eventName: MessageEventName.TabLoaded,
        },
        undefined
      )
      .catch((caught) => {
        console.log({ caught });
      });
  }, 1000);
});

browser.runtime.onMessage.addListener(function (request: any, sender: any) {
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
  } else if (request.eventName === MessageEventName.ConfigRequested) {
    if (sender?.tab?.id) {
      browser.tabs.sendMessage(sender.tab.id, {
        eventName: MessageEventName.ConfigChanged,
        scoreConfig: scoreConfig,
      });
    } else {
      browser.runtime.sendMessage({
        eventName: MessageEventName.ConfigChanged,
        scoreConfig: scoreConfig,
      });
    }
  } else if (request.eventName === MessageEventName.ConfigChanged) {
    scoreConfig = request.scoreConfig;
    browser.tabs.sendMessage(request.tabId, {
      eventName: MessageEventName.ConfigChanged,
      scoreConfig,
    });
  }
  // if (request.greeting == "hello") {
  //   sendResponse({ farewell: "goodbye" });
  // }
});

function setIconBasedOnScore(score: ScoreDetails, tabId: number) {
  const scoreTotal = getTotalFromScore(score, scoreConfig);

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

    browser.browserAction.setBadgeText({
      tabId,
      text: Math.floor(Math.min(100, scoreTotal)).toString(),
    });

    browser.browserAction.setBadgeBackgroundColor({ tabId, color: "#666" });
  }
}
