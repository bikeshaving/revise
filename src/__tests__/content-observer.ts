import {getContent} from "../content-observer";

function parseHTML(text: string): Node {
	return document.createRange().createContextualFragment(text);
}

describe("getContent", () => {
	test("divs basic", () => {
		const node = parseHTML("<div>Hello</div><div>World</div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("divs with trailing brs", () => {
		const node = parseHTML("<div>Hello<br /></div><div>World<br /></div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("nested divs", () => {
		const node = parseHTML("<div><div>Hello</div><div>World</div></div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("nested divs 1", () => {
		const node = parseHTML("<div><div><div>Hello</div></div><div>World</div></div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("br between divs", () => {
		const node = parseHTML("<div><div>Hello</div><br /><div>World</div></div>");
		expect(getContent(node)).toEqual("Hello\n\nWorld\n");
	});

	test("div before text", () => {
		const node = parseHTML("<div>Hello</div>World");
		expect(getContent(node)).toEqual("Hello\nWorld");
	});

	test("empty div", () => {
		const node = parseHTML("<div></div>Hello<div>World</div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("empty div at the end", () => {
		const node = parseHTML("<div>Hello<div>World</div><div></div></div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("span basic", () => {
		const node = parseHTML("<span>Hello World</span>");
		expect(getContent(node)).toEqual("Hello World");
	});

	test("span with br", () => {
		const node = parseHTML("<span>Hello World<br /></span>");
		expect(getContent(node)).toEqual("Hello World\n");
	});

	test("br span in div", () => {
		const node = parseHTML("<div>Hello<span><br /></span>World<span><br /></span></div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("empty div", () => {
		const node = parseHTML("<span>Hello World<br /></span>");
		expect(getContent(node)).toEqual("Hello World\n");
	});
});
