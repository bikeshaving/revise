import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname, join} from "node:path";
import {fileURLToPath} from "node:url";
import * as playwright from "playwright";

const dir = fileURLToPath(new URL(".", import.meta.url));
const args = Object.fromEntries(
	process.argv.slice(2).map((arg) => {
		const [name, value = true] = arg.replace(/^--/, "").split("=");
		return [name, value];
	}),
);
const browserName = args.browser || "chromium";
const lines = Number(args.lines || 50000);

const types = {".html": "text/html", ".js": "text/javascript"};
const server = createServer(async (req, res) => {
	try {
		const path = new URL(req.url, "http://localhost").pathname;
		const body = await readFile(join(dir, path));
		res.writeHead(200, {"content-type": types[extname(path)] || "text/plain"});
		res.end(body);
	} catch {
		res.writeHead(404);
		res.end();
	}
});
await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`;

const browser = await playwright[browserName].launch();
const page = await browser.newPage({viewport: {width: 1200, height: 900}});
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

const frame = () =>
	page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r))));
const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[sorted.length >> 1];
};
const round = (n) => Math.round(n * 10) / 10;

const loadStart = Date.now();
await page.goto(`${origin}/lines.html?lines=${lines}`);
await page.waitForFunction(() => window.renderMs !== undefined);
await frame();
const results = {
	browser: browserName,
	lines,
	"load: first render (ms)": round(await page.evaluate(() => window.renderMs)),
	"load: until first frame (ms)": Date.now() - loadStart,
};

async function keystrokes(keys) {
	const times = [];
	for (const key of keys) {
		await page.keyboard.press(key);
		await frame();
		times.push(await page.evaluate(() => window.bench.lastRender - window.bench.inputAt));
	}

	return round(median(times));
}

await page.locator("pre").click();
await page.evaluate(() => {
	const area = document.querySelector("content-area");
	const index = window.bench.state.value.split("\n").slice(0, 20).join("\n").length;
	area.setSelectionRange(index, index);
});
results["typing (median ms)"] = await keystrokes([..."abcdefghijklmnopqrst"]);
results["Enter (median ms)"] = await keystrokes(Array(10).fill("Enter"));
results["Backspace joining lines (median ms)"] = await keystrokes(Array(10).fill("Backspace"));

const recolor = await page.evaluate(async () => {
	const start = performance.now();
	window.bench.theme++;
	window.bench.refresh();
	const render = performance.now() - start;
	await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
	return {render, frame: performance.now() - start};
});
results["recolor visible lines (ms)"] = round(recolor.render);
results["recolor visible lines, to next frame (ms)"] = round(recolor.frame);

results["recolor after scrolling far (ms)"] = round(
	await page.evaluate(async (target) => {
		const lineAt = () => document.querySelectorAll("pre > div > div")[target];
		const expected = "t" + (window.bench.theme % 4);
		const start = performance.now();
		lineAt().scrollIntoView();
		while (lineAt().firstElementChild?.className !== expected) {
			await new Promise((r) => requestAnimationFrame(r));
			if (performance.now() - start > 10000) {
				return NaN;
			}
		}

		return performance.now() - start;
	}, Math.floor(lines * 0.8)),
);

results["DOM nodes"] = await page.evaluate(() => document.getElementsByTagName("*").length);
if (browserName === "chromium") {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("HeapProfiler.collectGarbage");
	await cdp.send("Performance.enable");
	const {metrics} = await cdp.send("Performance.getMetrics");
	const metric = (name) => metrics.find((m) => m.name === name).value;
	results["JS heap after GC (MB)"] = round(metric("JSHeapUsedSize") / 1048576);
}

results["value in sync"] = await page.evaluate(
	() => document.querySelector("content-area").value === window.bench.state.value,
);
results.errors = errors;

await browser.close();
server.close();

if (args.json) {
	console.log(JSON.stringify(results));
} else {
	for (const [name, value] of Object.entries(results)) {
		console.log(`${name.padEnd(44)} ${Array.isArray(value) ? value.join("; ") || "none" : value}`);
	}
}
