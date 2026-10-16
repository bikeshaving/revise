import {test, expect} from "@playwright/test";
import type {Page} from "@playwright/test";

async function open(page: Page, query = "") {
	await page.goto("/lines.html" + query);
	await page.locator("content-area").waitFor();
}

function inSync(page: Page) {
	return page.evaluate(() => {
		const area = document.querySelector("content-area") as any;
		return area.value === (window as any).harness.state.value;
	});
}

function chunkSizes(page: Page) {
	return page.evaluate(() =>
		[...document.querySelectorAll("[contenteditable] > div")].map(
			(chunk) => chunk.children.length,
		),
	);
}

async function tagLines(page: Page) {
	await page.evaluate(() => {
		document
			.querySelectorAll("[contenteditable] > div > div")
			.forEach((line, i) => ((line as any).tag = i));
	});
}

function untouchedLines(page: Page) {
	return page.evaluate(
		() =>
			[...document.querySelectorAll("[contenteditable] > div > div")].filter(
				(line) => (line as any).tag !== undefined,
			).length,
	);
}

async function clickLine(page: Page, i: number) {
	await page.locator("[contenteditable] > div > div").nth(i).click();
	await page.evaluate((i) => {
		const line = document.querySelectorAll("[contenteditable] > div > div")[i];
		const text = line.querySelector("span")!.firstChild as Text;
		document.getSelection()!.collapse(text, text.length);
	}, i);
}

function nextFrame(page: Page) {
	return page.evaluate(
		() => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve))),
	);
}

test.describe("Lines", () => {
	test("renders lines in chunks", async ({page}) => {
		await open(page);
		expect(await chunkSizes(page)).toEqual([10, 10, 10, 10]);
		expect(await inSync(page)).toBe(true);
	});

	test("typing renders only the edited line", async ({page}) => {
		await open(page);
		await clickLine(page, 25);
		await tagLines(page);
		await page.evaluate(() => ((window as any).harness.renders = 0));
		await page.keyboard.type("x");
		expect(await page.evaluate(() => (window as any).harness.renders)).toBe(1);
		expect(await untouchedLines(page)).toBeGreaterThanOrEqual(39);
		expect(
			await page.locator("[contenteditable] > div > div").nth(25).textContent(),
		).toBe("line 25x");
		expect(await inSync(page)).toBe(true);
	});

	test("line breaks, joins, and multi-line deletes stay in sync", async ({page}) => {
		await open(page);
		await clickLine(page, 3);
		await page.keyboard.press("ArrowLeft");
		await page.keyboard.press("ArrowLeft");
		await page.keyboard.press("Enter");
		expect(await inSync(page)).toBe(true);
		await page.keyboard.press("Backspace");
		expect(await inSync(page)).toBe(true);
		expect(await page.evaluate(() => (window as any).harness.state.value)).toContain(
			"line 3\nline 4\n",
		);
		await page.keyboard.press("Home");
		await page.keyboard.press("Backspace");
		expect(await inSync(page)).toBe(true);
		for (let i = 0; i < 14; i++) {
			await page.keyboard.press("Shift+ArrowDown");
		}

		await page.keyboard.press("Backspace");
		expect(await inSync(page)).toBe(true);
		await page.keyboard.type("joined");
		expect(await inSync(page)).toBe(true);
		const sizes = await chunkSizes(page);
		expect(sizes.every((size) => size > 0)).toBe(true);
		expect(sizes.reduce((a, b) => a + b)).toBe(
			await page.evaluate(
				() => (window as any).harness.state.value.split("\n").length - 1,
			),
		);
	});

	test("Enter after a space keeps a plain space", async ({page, browserName}) => {
		test.fail(browserName === "webkit", "WebKit turns the space into a non-breaking space");
		await open(page);
		await clickLine(page, 3);
		await page.keyboard.press("ArrowLeft");
		await page.keyboard.press("Enter");
		expect(await page.evaluate(() => (window as any).harness.state.value)).toContain(
			"line \n3\n",
		);
	});

	test("undo and redo stay in sync", async ({page}) => {
		await open(page);
		await clickLine(page, 12);
		await page.keyboard.press("Enter");
		await page.keyboard.type("new");
		await page.keyboard.press("ControlOrMeta+z");
		expect(await inSync(page)).toBe(true);
		await page.keyboard.press("ControlOrMeta+Shift+z");
		expect(await inSync(page)).toBe(true);
		expect(await page.evaluate(() => (window as any).harness.state.value)).toContain(
			"line 12\nnew\n",
		);
	});

	test("a chunk splits after growing past twice its size", async ({page}) => {
		await open(page);
		await clickLine(page, 5);
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press("Enter");
		}

		const sizes = await chunkSizes(page);
		expect(sizes.reduce((a, b) => a + b)).toBe(55);
		expect(sizes.length).toBeGreaterThan(4);
		expect(Math.max(...sizes)).toBeLessThanOrEqual(20);
		expect(Math.min(...sizes)).toBeGreaterThanOrEqual(10);
		expect(await inSync(page)).toBe(true);
	});

	test("a revision rechecks visible chunks and defers the rest", async ({page}) => {
		await open(page, "?lines=400&chunk=10");
		await nextFrame(page);
		await nextFrame(page);
		await page.evaluate(() => {
			const harness = (window as any).harness;
			harness.renders = 0;
			harness.color = "b";
			harness.revision++;
			harness.refresh();
		});
		const classOfLine = (i: number) =>
			page.evaluate(
				(i) =>
					document
						.querySelectorAll("[contenteditable] > div > div")
						[i].querySelector("span")?.className ?? null,
				i,
			);
		expect(await classOfLine(0)).toBe("b");
		expect(await classOfLine(300)).toBe(null);
		const renders = await page.evaluate(() => (window as any).harness.renders);
		expect(renders).toBeLessThan(200);
		await page.evaluate(() =>
			document.querySelectorAll("[contenteditable] > div > div")[300].scrollIntoView(),
		);
		await expect
			.poll(() => classOfLine(300))
			.toBe("b");
		expect(await inSync(page)).toBe(true);
	});

	test("renders without an edit do not scroll to the caret", async ({page}) => {
		await open(page, "?lines=400&chunk=10");
		await clickLine(page, 2);
		await page.evaluate(() => window.scrollTo(0, 4000));
		await nextFrame(page);
		await page.evaluate(() => {
			const harness = (window as any).harness;
			harness.color = "b";
			harness.revision++;
			harness.refresh();
		});
		await nextFrame(page);
		expect(await page.evaluate(() => window.scrollY)).toBe(4000);
	});

	test("falls back to diffing when the state has no edit", async ({page}) => {
		await open(page, "?state=published");
		await clickLine(page, 7);
		await page.keyboard.type("abc");
		await page.keyboard.press("Enter");
		await page.keyboard.press("Backspace");
		await page.keyboard.press("Backspace");
		expect(await inSync(page)).toBe(true);
		expect(await page.evaluate(() => (window as any).harness.state.value)).toContain(
			"line 7ab\nline 8\n",
		);
	});
});

test.describe("Lines with random edits", () => {
	for (const skip of [false, true]) {
		test(skip ? "with skipped renders" : "rendered after every edit", async ({page}) => {
			await open(page, "?lines=30&chunk=4");
			const failure = await page.evaluate((skip) => {
				const harness = (window as any).harness;
				const area = document.querySelector("content-area") as any;
				const alphabet = ["a", "b", " ", "\n", "\n"];
				for (let seed = 1; seed <= 20; seed++) {
					let s = seed;
					const random = () => {
						s = (s + 0x6d2b79f5) | 0;
						let t = Math.imul(s ^ (s >>> 15), 1 | s);
						t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
						return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
					};
					const int = (n: number) => Math.floor(random() * n);
					harness.state.reset(
						Array.from({length: 30}, (_, i) => `line ${i}\n`).join(""),
					);
					harness.refresh();
					let action = "";
					for (let step = 0; step < 300; step++) {
						const roll = random();
						const rendered = area.value;
						const state = harness.state;
						if (roll < 0.1) {
							action = "undo";
							state.undo();
						} else if (roll < 0.15) {
							action = "redo";
							state.redo();
						} else if (roll < 0.2) {
							action = "revision";
							harness.color = harness.color === "a" ? "b" : "a";
							harness.revision++;
						} else {
							const value: string = state.value;
							const at = int(value.length + 1);
							const length = int(Math.min(40, value.length - at) + 1);
							let insert = "";
							for (let i = int(12); i > 0; i--) {
								insert += alphabet[int(alphabet.length)];
							}

							let next = value.slice(0, at) + insert + value.slice(at + length);
							if (!next.endsWith("\n")) {
								next += "\n";
							}

							if (roll < 0.3) {
								state.checkpoint();
							}

							action = "set";
							state.setValue(next);
						}

						if (skip && random() < 0.3) {
							continue;
						}

						harness.refresh();
						const sizes = [
							...document.querySelectorAll("[contenteditable] > div"),
						].map((chunk) => chunk.children.length);
						const problem =
							area.value !== state.value
								? "value"
								: sizes.some((size) => size === 0 || size > 8)
									? "chunk sizes " + sizes.join(",")
									: null;
						if (problem) {
							return {seed, step, problem, action, before: rendered, value: state.value, dom: area.value};
						}
					}
				}

				return null;
			}, skip);
			expect(failure).toBe(null);
		});
	}
});
