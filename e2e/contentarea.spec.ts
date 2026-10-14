import {test, expect} from "@playwright/test";

async function mount(page: any, html: string) {
	await page.goto("/core.html");
	await page.evaluate((html: string) => {
		document.body.innerHTML = html;
	}, html);
	await page.locator("[contenteditable='true']").focus();
}

test.describe("setSelectionRange", () => {
	test("is reflected by getSelectionRange immediately", async ({page}) => {
		await mount(
			page,
			`<content-area><div contenteditable="true">ch</div></content-area>`,
		);
		const start = await page.locator("content-area").evaluate((el: any) => {
			el.setSelectionRange(2, 2);
			return el.getSelectionRange().start;
		});
		expect(start).toBe(2);
	});

	test("is reflected immediately next to a data-content element", async ({page}) => {
		await mount(
			page,
			`<content-area><div contenteditable="true"><span contenteditable="false" data-content="A, ">A</span>ch</div></content-area>`,
		);
		const result = await page.locator("content-area").evaluate((el: any) => {
			el.setSelectionRange(5, 5);
			const sel = document.getSelection()!;
			return {
				start: el.getSelectionRange().start,
				node: sel.focusNode!.textContent,
				offset: sel.focusOffset,
			};
		});
		expect(result).toEqual({start: 5, node: "ch", offset: 2});
	});

	test("at the end of a block keeps the caret inside the editable", async ({page}) => {
		await mount(
			page,
			`<content-area><div contenteditable="true"><div>one</div><div>two</div></div></content-area>`,
		);
		const result = await page.locator("content-area").evaluate((el: any) => {
			el.setSelectionRange(el.value.length, el.value.length);
			const sel = document.getSelection()!;
			const editable = el.querySelector("[contenteditable]");
			return {
				value: el.value,
				inside: editable.contains(sel.focusNode),
				start: el.getSelectionRange().start,
			};
		});
		expect(result.value).toBe("one\ntwo\n");
		expect(result.inside).toBe(true);
		expect(result.start).toBe(7);
	});

	test("typing after selecting the end appends to the last line", async ({page}) => {
		await mount(
			page,
			`<content-area><div contenteditable="true"><div>ch</div></div></content-area>`,
		);
		await page.locator("content-area").evaluate((el: any) => {
			el.setSelectionRange(el.value.length, el.value.length);
		});
		await page.keyboard.type("x");
		const value = await page.locator("content-area").evaluate((el: any) => el.value);
		expect(value).toBe("chx\n");
	});
});

test.describe("pending mutations", () => {
	test("are recorded before keydown handlers inside the area run", async ({page}) => {
		await mount(
			page,
			`<content-area><div contenteditable="true"><div>Ad</div></div></content-area>`,
		);
		const result = await page.locator("content-area").evaluate((el: any) => {
			const log: Array<string> = [];
			const editable = el.querySelector("[contenteditable]");
			el.addEventListener("contentchange", () => log.push("contentchange"));
			editable.addEventListener("keydown", () => log.push("keydown"));
			el.value;
			const text = editable.querySelector("div").firstChild;
			text.insertData(2, "a");
			editable.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab", bubbles: true}));
			return log;
		});
		expect(result).toEqual(["contentchange", "keydown"]);
	});
});
