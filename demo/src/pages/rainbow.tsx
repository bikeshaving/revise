import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {Keyer} from "@b9g/revise/keyer.js";
import {ContentArea} from "../components/contentarea";

const COLORS = [
	"#FF0000",
	"#FFA500",
	"#FFDC00",
	"#008000",
	"#0000FF",
	"#4B0082",
	"#800080",
];

function Rainbow(this: Context, {value, keyer}: {value: string; keyer: Keyer}) {
	let lines = value.split(/\r\n|\r|\n/);
	if (/(?:\r\n|\r|\n)$/.test(value)) {
		lines.pop();
	}

	let cursor = 0;
	// Testing different rendering strategies for lines.
	lines = lines.map((line) => {
		const key = keyer.keyAt(cursor);
		cursor += line.length + 1;
		const chars = line ? (
			[...line].map((char, i) => (
				<span style={{color: COLORS[i % COLORS.length]}}>{char}</span>
			))
		) : (
			<br />
		);
		return <div key={key}>{chars}</div>;
	});

	return (
		<div class="editable" contenteditable="true">
			{lines}
		</div>
	);
}

function* App(this: Context<{}>) {
	let value = "\n";
	const keyer = new Keyer();
	this.addEventListener("contentchange", (ev: any) => {
		keyer.transform(ev.detail.edit);
		if (ev.detail.source === "render") {
			return;
		}

		ev.preventDefault();
		value = ev.target.value;
		this.refresh();
	});

	for ({} of this) {
		yield (
			<div class="app">
				<p class="">Using content-area to render a rainbow textarea.</p>
				<ContentArea value={value} renderSource="render">
					<Rainbow value={value} keyer={keyer} />
				</ContentArea>
			</div>
		);
	}
}

renderer.render(<App />, document.getElementById("root")!);
