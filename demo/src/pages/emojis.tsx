import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
// @ts-ignore
import twemoji from "twemoji";
import {Keyer} from "@b9g/revise/keyer.js";
import {ContentArea} from "../components/contentarea";

function Twemoji(this: Context, {value, keyer}: {value: string; keyer: Keyer}) {
	const lines = value.split(/\r\n|\r|\n/);
	if (/\r\n|\r|\n$/.test(value)) {
		lines.pop();
	}

	let cursor = 0;
	return (
		<div class="editable" contenteditable="true">
			{lines.map((line) => {
				const line1 = twemoji.parse(line, {
					attributes(emoji: any) {
						return {"data-content": emoji};
					},
				});

				const key = keyer.keyAt(cursor);
				cursor += line.length + 1;
				return line ? <div crank-key={key} innerHTML={line1} /> : (
					<div crank-key={key}>
						<br />
					</div>
				);
			})}
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

		value = ev.target.value;
		this.refresh();
	});

	for ({} of this) {
		yield (
			<div class="app">
				<p>Using content-area to render Twemojis.</p>
				<ContentArea value={value} renderSource="render">
					<Twemoji value={value} keyer={keyer} />
				</ContentArea>
			</div>
		);
	}
}

renderer.render(<App />, document.getElementById("root")!);
