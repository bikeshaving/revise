import {ContentAreaElement} from "../content-observer";

describe("contentarea", () => {
	let area!: ContentAreaElement;
	beforeAll(() => {
		window.customElements.define("content-area", ContentAreaElement);
	});

	beforeEach(() => {
		document.body.innerHTML =
			'<content-area contenteditable="true"></content-area>';
		area = document.body.firstChild as ContentAreaElement;
	});

	test("divs", () => {
		area.innerHTML = "<div>Hello</div><div>World</div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("divs with trailing brs", () => {
		area.innerHTML = "<div>Hello<br /></div><div>World<br /></div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("divs in a div", () => {
		area.innerHTML = "<div><div>Hello</div><div>World</div></div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("nested divs", () => {
		area.innerHTML = "<div><div><div>Hello</div></div><div>World</div></div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("br between divs", () => {
		area.innerHTML = "<div><div>Hello</div><br /><div>World</div></div>";
		expect(area.value).toEqual("Hello\n\nWorld\n");
	});

	test("div before text", () => {
		area.innerHTML = "<div><div>Hello</div>World</div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("div after text", () => {
		area.innerHTML = "<div>Hello<div>World</div></div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("nested div before text", () => {
		area.innerHTML = "<div><div><div>Hello</div></div>World</div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("nested div after text and spans", () => {
		area.innerHTML =
			"<div><span>H</span>ell<span>o</span><div><div><span>W</span>orl<span>d</span></div></div></div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("div br between text", () => {
		area.innerHTML = "<div>Hello<div><br></div>World</div>";
		expect(area.value).toEqual("Hello\n\nWorld\n");
	});

	test("empty div", () => {
		area.innerHTML = "<div></div>Hello<div>World</div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("empty div at the end", () => {
		area.innerHTML = "<div>Hello<div>World</div><div></div></div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});

	test("span basic", () => {
		area.innerHTML = "<span>Hello World</span>";
		expect(area.value).toEqual("Hello World");
	});

	test("span with br", () => {
		area.innerHTML = "<span>Hello World<br /></span>";
		expect(area.value).toEqual("Hello World\n");
	});

	test("empty span with br at end of div", () => {
		area.innerHTML =
			"<div>Hello<span><br /></span>World<span><br /></span></div>";
		expect(area.value).toEqual("Hello\nWorld\n");
	});
});
