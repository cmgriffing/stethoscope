import * as React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { browser, Tabs } from "webextension-polyfill-ts";
import { MessageEventName, Score, ScoreDetails } from "../types";
import { getGradeFromScoreTotal, getTotalFromScore } from "../utils";
import { Icon } from "@iconify/react";
import "./styles.scss";

function openWebPage(url: string): Promise<Tabs.Tab> {
	return browser.tabs.create({ url });
}

const Popup: React.FC = () => {
	const [scoreDetails, setScoreDetails] = React.useState<ScoreDetails>();
	const [scoreTotal, setScoreTotal] = React.useState(0);
	const [grade, setGrade] = React.useState<{ color: string; letter: string }>();

	React.useEffect(() => {
		const messageListener = (message: any, _sender: any) => {
			if (message.eventName === MessageEventName.ScoreCalculated) {
				setScoreDetails(message.score);
				const newScoreTotal = getTotalFromScore(message.score);
				setScoreTotal(newScoreTotal);
				setGrade(getGradeFromScoreTotal(newScoreTotal));
			}
		};

		browser.runtime.onMessage.addListener(messageListener);

		browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
			browser.runtime.sendMessage({
				eventName: MessageEventName.ScoreRequested,
				tabId: tabs[0]?.id,
			});
		});

		return function () {
			browser.runtime.onMessage.removeListener(messageListener);
		};
	}, []);
	//   <button
	//     id="options__button"
	//     type="button"
	//     onClick={(): Promise<Tabs.Tab> => {
	//       return openWebPage("options.html");
	//     }}
	//   >
	//     Options Page
	//   </button>

	return (
		<section className="popup">
			<div className="sidebar">
				<CircularProgressbar
					className="score-circle"
					value={scoreTotal}
					text={`${Math.floor(scoreTotal)}%`}
					styles={buildStyles({
						textColor: "#111",
						pathColor: grade?.color || "#DDD",
						backgroundColor: "#DDD",
					})}
					background={true}
				/>
				<div className="letter-grade">{grade?.letter}</div>
				<h3 className="repo-detail">Repo: {scoreDetails?.repoName}</h3>
				<h4 className="repo-detail">Author: {scoreDetails?.authorName}</h4>
			</div>
			<div className="content">
				<div className="header">
					<a
						className="plugin-link"
						href="https://github.com/cmgriffing/stethoscope"
						onClick={(event) => {
							event.preventDefault();
							openWebPage("https://github.com/cmgriffing/stethoscope");
							return false;
						}}
					>
						<h2>🩺 Stethoscope</h2>
					</a>
				</div>
				<div className="details">
					<ul>
						{Object.values(scoreDetails?.scores || []).map((score: Score) => (
							<li>
								<span className="detail-label">{score.label}</span>
								{score.score > 0 ? (
									<Icon icon="bi:check-circle-fill" color="#080" />
								) : (
									<Icon icon="bi:x-octagon-fill" color="#b00" />
								)}
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
};

export default Popup;
