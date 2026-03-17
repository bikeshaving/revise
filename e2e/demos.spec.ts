import {test, expect} from "@playwright/test";

async function areaValue(page: any, selector = "content-area"): Promise<string> {
	return page.locator(selector).evaluate((el: any) => el.value);
}

test.describe("Todo demo", () => {
	test.beforeEach(async ({page}) => {
		await page.goto("/todo.html");
		await page.locator("content-area").waitFor();
	});

	test("initial state has 4 todo items", async ({page}) => {
		const value = await areaValue(page);
		expect(value).toBe(
			"- [x] Build content-area\n" +
			"- [x] Build Edit data structure\n" +
			"- [ ] Write documentation\n" +
			"- [ ] Take over the world\n",
		);
	});

	test("Enter continues with unchecked todo", async ({page}) => {
		const area = page.locator("content-area");
		await area.evaluate((el: any) => {
			const len = "- [x] Build content-area".length;
			el.setSelectionRange(len, len);
		});
		await page.keyboard.press("Enter");
		const value = await areaValue(page);
		const lines = value.split("\n");
		expect(lines[1]).toBe("- [ ] ");
	});

	test("Enter on empty todo exits todo mode", async ({page}) => {
		const area = page.locator("content-area");
		await area.evaluate((el: any) => {
			const len = "- [x] Build content-area".length;
			el.setSelectionRange(len, len);
		});
		await page.keyboard.press("Enter");
		await page.waitForTimeout(50);
		await page.keyboard.press("Enter");
		const value = await areaValue(page);
		const lines = value.split("\n");
		expect(lines[1]).toBe("");
	});

	test("Backspace at start of todo content removes prefix", async ({page}) => {
		const area = page.locator("content-area");
		await area.evaluate((el: any) => {
			const pos = "- [x] Build content-area\n- [x] ".length;
			el.setSelectionRange(pos, pos);
		});
		await page.keyboard.press("Backspace");
		const value = await areaValue(page);
		expect(value.startsWith("- [x] Build content-area")).toBe(true);
		expect(value).toContain("Build Edit data structure");
		expect(value).not.toContain("- [x] Build content-area\n- [x] Build Edit data structure");
	});

	test("select all + delete clears content", async ({page}) => {
		const editable = page.locator("[contenteditable='true']");
		await editable.click();
		await page.keyboard.press("Meta+a");
		await page.keyboard.press("Backspace");
		// First backspace leaves the virtual prefix on the surviving div
		await page.keyboard.press("Backspace");
		// Second backspace removes the empty prefix
		const value = await areaValue(page);
		expect(value).toBe("\n");
	});

	test("clicking checkbox toggles checked state", async ({page}) => {
		const checkbox = page.locator("input[type=checkbox]").nth(2);
		await checkbox.click();
		const value = await areaValue(page);
		expect(value).toContain("- [x] Write documentation");
	});
});

test.describe("Blockquote demo", () => {
	test.beforeEach(async ({page}) => {
		await page.goto("/blockquote.html");
		await page.locator("content-area").waitFor();
	});

	test("initial state", async ({page}) => {
		const value = await areaValue(page);
		expect(value).toBe(
			"> To be, or not to be, that is the question\u2014\n" +
			"> Whether 'tis nobler in the mind to suffer\n" +
			"Hamlet, Act 3, Scene 1\n",
		);
	});

	test("Enter continues blockquote", async ({page}) => {
		const area = page.locator("content-area");
		await area.evaluate((el: any) => {
			const len = "> To be, or not to be, that is the question\u2014".length;
			el.setSelectionRange(len, len);
		});
		await page.keyboard.press("Enter");
		const value = await areaValue(page);
		const lines = value.split("\n");
		expect(lines[1]).toBe("> ");
	});

	test("Enter on empty blockquote exits quote mode", async ({page}) => {
		const area = page.locator("content-area");
		await area.evaluate((el: any) => {
			const len = "> To be, or not to be, that is the question\u2014".length;
			el.setSelectionRange(len, len);
		});
		await page.keyboard.press("Enter");
		await page.waitForTimeout(50);
		await page.keyboard.press("Enter");
		const value = await areaValue(page);
		const lines = value.split("\n");
		expect(lines[1]).toBe("");
	});

	test("select all + delete clears content", async ({page}) => {
		const editable = page.locator("[contenteditable='true']");
		await editable.click();
		await page.keyboard.press("Meta+a");
		await page.keyboard.press("Backspace");
		// First backspace leaves the virtual prefix on the surviving div
		await page.keyboard.press("Backspace");
		// Second backspace removes the empty prefix
		const value = await areaValue(page);
		expect(value).toBe("\n");
	});

	test("Backspace at start of blockquote content removes prefix", async ({page}) => {
		const area = page.locator("content-area");
		await area.evaluate((el: any) => {
			const pos = "> To be, or not to be, that is the question\u2014\n> ".length;
			el.setSelectionRange(pos, pos);
		});
		await page.keyboard.press("Backspace");
		const value = await areaValue(page);
		expect(value).toContain("question\u2014");
		expect(value).toContain("Whether");
		expect(value).not.toContain("\n> Whether");
	});
});
