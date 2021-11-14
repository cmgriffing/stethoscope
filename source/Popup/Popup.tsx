import * as React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { browser, Tabs } from "webextension-polyfill-ts";
import { MessageEventName, ScoreConfig, ScoreKey } from "../types";
import { getGradeFromScoreTotal, getTotalFromScore } from "../utils";
import { Icon } from "@iconify/react";
import "./styles.scss";
import { Switch } from "@chakra-ui/react";
import { cloneDeep } from "lodash";
import { createScoreDetails, defaultScoreConfig } from "../data";

const baseScoreConfig = cloneDeep(defaultScoreConfig);

function openWebPage(url: string): Promise<Tabs.Tab> {
  return browser.tabs.create({ url });
}

const Popup: React.FC = () => {
  const [scoreDetails, setScoreDetails] = React.useState(createScoreDetails());
  const [scoreConfig, setScoreConfig] =
    React.useState<ScoreConfig>(baseScoreConfig);
  const [scoreTotal, setScoreTotal] = React.useState(0);
  const [grade, setGrade] = React.useState<{ color: string; letter: string }>();
  const [settingsShowing, setSettingsShowing] = React.useState(false);

  React.useEffect(() => {
    const messageListener = (message: any, _sender: any) => {
      if (message.eventName === MessageEventName.ScoreCalculated) {
        setScoreDetails(message.score);
      } else if (message.eventName === MessageEventName.ConfigChanged) {
        setScoreConfig(message.scoreConfig);
      }
    };

    browser.runtime.onMessage.addListener(messageListener);

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.runtime.sendMessage({
        eventName: MessageEventName.ScoreRequested,
        tabId: tabs[0]?.id,
      });

      browser.runtime.sendMessage({
        eventName: MessageEventName.ConfigRequested,
      });
    });

    return function () {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  React.useEffect(() => {
    const newScoreTotal = getTotalFromScore(scoreDetails, scoreConfig);
    setScoreTotal(newScoreTotal);
  }, [scoreDetails, scoreConfig]);

  React.useEffect(() => {
    setGrade(getGradeFromScoreTotal(scoreTotal));
  }, [scoreTotal]);

  return (
    <>
      {!scoreDetails && (
        <section className="popup no-score-found">
          <h2>
            <Icon icon="clarity:heart-broken-line" className="no-score-icon" />{" "}
            No Score found
          </h2>
          <p>We couldn't find a score for the current page.</p>
          <p>
            {" "}
            If you think this is an error, please{" "}
            <a
              className="issue-link"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/cmgriffing/stethoscope/issues"
            >
              create an issue
            </a>{" "}
            on our{" "}
            <a
              className="issue-link"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/cmgriffing/stethoscope"
            >
              Github repo
            </a>
            .
          </p>
        </section>
      )}
      {!!scoreDetails && (
        <section
          className={`popup ${settingsShowing ? "settings-showing" : ""}`}
        >
          <div className="sidebar">
            <CircularProgressbar
              className="score-circle"
              value={scoreTotal}
              text={`${Math.min(Math.floor(scoreTotal), 100)}%`}
              styles={buildStyles({
                textColor: "#111",
                pathColor: grade?.color || "#DDD",
                backgroundColor: "#DDD",
              })}
              background={true}
            />
            <div className="letter-grade">{grade?.letter}</div>
            <h3
              className="repo-detail repo-name"
              title={scoreDetails?.repoName}
            >
              <span className=" single-line-ellipsis">
                {scoreDetails?.repoName}
              </span>
            </h3>
            <h4
              className="repo-detail repo-author"
              title={scoreDetails?.authorName}
            >
              <span className=" single-line-ellipsis">
                {scoreDetails?.authorName}
              </span>
            </h4>
          </div>
          <div className="content">
            <div className="header">
              <a
                className="plugin-link"
                href="https://github.com/cmgriffing/stethoscope#readme"
                onClick={(event) => {
                  event.preventDefault();
                  openWebPage(
                    "https://github.com/cmgriffing/stethoscope#readme"
                  );
                  return false;
                }}
              >
                <h2 className="title">
                  <span className="title-icon">🩺</span> Stethoscope{" "}
                </h2>
              </a>
              <button
                onClick={() => {
                  setSettingsShowing(!settingsShowing);
                }}
              >
                {!settingsShowing && (
                  <Icon icon="carbon:settings" className="settings-icon" />
                )}
                {settingsShowing && (
                  <Icon
                    icon="carbon:settings-check"
                    className="settings-icon"
                  />
                )}
              </button>
            </div>
            {!scoreDetails?.hasLicense && (
              <div className="details no-license">
                <h2>No License found.</h2>
                <p>
                  A repo without a license is unusable as far as this extension
                  is concerned.
                </p>
              </div>
            )}
            {scoreDetails?.hasLicense && (
              <div className="details">
                <ul>
                  {Object.entries(scoreDetails?.scores || []).map((entry) => {
                    const scoreKey = entry[0] as ScoreKey;
                    const score = entry[1];

                    const scoreKeyEnabled =
                      scoreConfig?.values[scoreKey].enabled;

                    return (
                      <li>
                        <span className="detail-label">{score.label}</span>
                        {score.score > 0 ? (
                          <Icon
                            className="score-icon pass"
                            icon="bi:check-circle-fill"
                          />
                        ) : (
                          <Icon
                            className="score-icon fail"
                            icon="bi:x-octagon-fill"
                          />
                        )}
                        <div className="score-detail-toggle">
                          <label className="sr-only">
                            Toggle {score.label}
                          </label>
                          <Switch
                            id={`${scoreKey}-switch`}
                            size="sm"
                            isChecked={scoreKeyEnabled}
                            onChange={() => {
                              browser.tabs
                                .query({ active: true, currentWindow: true })
                                .then((tabs) => {
                                  // update config object
                                  const newScoreConfig = cloneDeep(scoreConfig);
                                  newScoreConfig.values[scoreKey].enabled =
                                    !scoreKeyEnabled;
                                  newScoreConfig.modifiedDate = Date.now();

                                  setScoreConfig(newScoreConfig);

                                  const currentKeyScoreValue =
                                    scoreDetails?.scores?.[scoreKey]?.score;
                                  // current value is inverse of previous value
                                  if (!scoreKeyEnabled) {
                                    setScoreTotal(
                                      scoreTotal + currentKeyScoreValue
                                    );
                                  } else {
                                    setScoreTotal(
                                      scoreTotal - currentKeyScoreValue
                                    );
                                  }

                                  const tabId = tabs[0]?.id || 0;

                                  browser.runtime.sendMessage({
                                    eventName: MessageEventName.ConfigChanged,
                                    tabId,
                                    scoreConfig: newScoreConfig,
                                  });
                                });
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="scroll-indicator"></div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default Popup;
