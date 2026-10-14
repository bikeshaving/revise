import {test, expect} from "@playwright/test";

test.describe("Editable with unrecorded mutations", () => {
	test.beforeEach(async ({page}) => {
		await page.goto("/pending.html");
		await page.locator("content-area").waitFor();
	});

	test("a keydown in the same task as typing sees the typed text first", async ({page}) => {
		const result = await page.evaluate(async () => {
			const area = document.querySelector("content-area") as any;
			const editable = area.querySelector("[contenteditable]") as HTMLElement;
			editable.focus();
			area.setSelectionRange(2, 2);
			const text = editable.querySelector("div")!.firstChild as Text;
			text.insertData(2, "a");
			editable.dispatchEvent(
				new KeyboardEvent("keydown", {key: "Tab", bubbles: true, cancelable: true}),
			);
			await new Promise((resolve) => setTimeout(resolve, 50));
			return {
				state: (window as any).state.value,
				area: area.value,
				dom: editable.textContent,
			};
		});
		expect(result.state).toBe("Ada Lovelace <ada@example.com>, \n");
		expect(result.area).toBe(result.state);
		expect(result.dom).toBe("Ada Lovelace <ada@example.com>, ");
	});
});
