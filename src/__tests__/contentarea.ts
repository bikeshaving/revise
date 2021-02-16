import {
	ContentAreaElement,
	getContent,
	invalidate,
	indexFromNodeOffset,
	nodeOffsetFromIndex,
} from "../contentarea";

function parseHTML(text: string): Node {
	const fragment = document.createRange().createContextualFragment(text);
	if (fragment.childNodes.length === 0) {
		throw new Error("No parsed nodes");
	} else if (fragment.childNodes.length > 1) {
		return fragment;
	}

	return fragment.firstChild!;
}

describe("nodeOffsetAt/indexOf", () => {
	test("adjacent divs", () => {
		const node = parseHTML("<div><div>hello</div><div>world</div></div>");
		const content = getContent(node);
		expect(content).toEqual("hello\nworld\n");
		expect(nodeOffsetFromIndex(node, -2)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, -1)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, 0)).toEqual([
			node.childNodes[0].firstChild,
			0,
		]);
		expect(nodeOffsetFromIndex(node, 1)).toEqual([
			node.childNodes[0].firstChild,
			1,
		]);
		expect(nodeOffsetFromIndex(node, 2)).toEqual([
			node.childNodes[0].firstChild,
			2,
		]);
		expect(nodeOffsetFromIndex(node, 3)).toEqual([
			node.childNodes[0].firstChild,
			3,
		]);
		expect(nodeOffsetFromIndex(node, 4)).toEqual([
			node.childNodes[0].firstChild,
			4,
		]);
		expect(nodeOffsetFromIndex(node, 5)).toEqual([
			node.childNodes[0].firstChild,
			5,
		]);
		expect(nodeOffsetFromIndex(node, 6)).toEqual([node.childNodes[1], 0]);
		expect(nodeOffsetFromIndex(node, 7)).toEqual([
			node.childNodes[1].firstChild,
			1,
		]);
		expect(nodeOffsetFromIndex(node, 8)).toEqual([
			node.childNodes[1].firstChild,
			2,
		]);
		expect(nodeOffsetFromIndex(node, 9)).toEqual([
			node.childNodes[1].firstChild,
			3,
		]);
		expect(nodeOffsetFromIndex(node, 10)).toEqual([
			node.childNodes[1].firstChild,
			4,
		]);
		expect(nodeOffsetFromIndex(node, 11)).toEqual([
			node.childNodes[1].firstChild,
			5,
		]);
		expect(nodeOffsetFromIndex(node, 12)).toEqual([node, 2]);
		expect(nodeOffsetFromIndex(node, 13)).toEqual([node, 2]);

		for (let i = -3; i < content.length + 3; i++) {
			expect(indexFromNodeOffset(node, ...nodeOffsetFromIndex(node, i))).toBe(
				Math.max(-1, Math.min(i, content.length)),
			);
		}
	});

	test("div after text", () => {
		const node = parseHTML("<div>hello<div>world</div></div>");
		const content = getContent(node);
		expect(content).toEqual("hello\nworld\n");
		expect(nodeOffsetFromIndex(node, -2)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, -1)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, 0)).toEqual([node.childNodes[0], 0]);
		expect(nodeOffsetFromIndex(node, 1)).toEqual([node.childNodes[0], 1]);
		expect(nodeOffsetFromIndex(node, 2)).toEqual([node.childNodes[0], 2]);
		expect(nodeOffsetFromIndex(node, 3)).toEqual([node.childNodes[0], 3]);
		expect(nodeOffsetFromIndex(node, 4)).toEqual([node.childNodes[0], 4]);
		expect(nodeOffsetFromIndex(node, 5)).toEqual([node.childNodes[0], 5]);
		expect(nodeOffsetFromIndex(node, 6)).toEqual([
			node.childNodes[1].firstChild,
			0,
		]);
		expect(nodeOffsetFromIndex(node, 7)).toEqual([
			node.childNodes[1].firstChild,
			1,
		]);
		expect(nodeOffsetFromIndex(node, 8)).toEqual([
			node.childNodes[1].firstChild,
			2,
		]);
		expect(nodeOffsetFromIndex(node, 9)).toEqual([
			node.childNodes[1].firstChild,
			3,
		]);
		expect(nodeOffsetFromIndex(node, 10)).toEqual([
			node.childNodes[1].firstChild,
			4,
		]);
		expect(nodeOffsetFromIndex(node, 11)).toEqual([
			node.childNodes[1].firstChild,
			5,
		]);
		expect(nodeOffsetFromIndex(node, 12)).toEqual([node, 2]);
		expect(nodeOffsetFromIndex(node, 13)).toEqual([node, 2]);
		expect(nodeOffsetFromIndex(node, 14)).toEqual([node, 2]);

		for (let i = -3; i < content.length + 3; i++) {
			expect(indexFromNodeOffset(node, ...nodeOffsetFromIndex(node, i))).toBe(
				Math.max(-1, Math.min(i, content.length)),
			);
		}
	});

	test("double br", () => {
		const node = parseHTML("<div>hello<br><br>world</div>");
		const content = getContent(node);
		expect(content).toEqual("hello\n\nworld\n");
		expect(nodeOffsetFromIndex(node, -2)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, -1)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, 0)).toEqual([node.childNodes[0], 0]);
		expect(nodeOffsetFromIndex(node, 1)).toEqual([node.childNodes[0], 1]);
		expect(nodeOffsetFromIndex(node, 2)).toEqual([node.childNodes[0], 2]);
		expect(nodeOffsetFromIndex(node, 3)).toEqual([node.childNodes[0], 3]);
		expect(nodeOffsetFromIndex(node, 4)).toEqual([node.childNodes[0], 4]);
		expect(nodeOffsetFromIndex(node, 5)).toEqual([node.childNodes[0], 5]);
		expect(nodeOffsetFromIndex(node, 6)).toEqual([node, 2]);
		expect(nodeOffsetFromIndex(node, 7)).toEqual([node.childNodes[3], 0]);
		expect(nodeOffsetFromIndex(node, 8)).toEqual([node.childNodes[3], 1]);
		expect(nodeOffsetFromIndex(node, 9)).toEqual([node.childNodes[3], 2]);
		expect(nodeOffsetFromIndex(node, 10)).toEqual([node.childNodes[3], 3]);
		expect(nodeOffsetFromIndex(node, 11)).toEqual([node.childNodes[3], 4]);
		expect(nodeOffsetFromIndex(node, 12)).toEqual([node.childNodes[3], 5]);
		expect(nodeOffsetFromIndex(node, 13)).toEqual([node, 4]);
		expect(nodeOffsetFromIndex(node, 14)).toEqual([node, 4]);
		expect(nodeOffsetFromIndex(node, 15)).toEqual([node, 4]);
		for (let i = -3; i < content.length + 3; i++) {
			expect(indexFromNodeOffset(node, ...nodeOffsetFromIndex(node, i))).toBe(
				Math.max(-1, Math.min(i, content.length)),
			);
		}
	});

	test("text and br alternating", () => {
		const node = parseHTML("<div>hello<br>world<br></div>");
		const content = getContent(node);
		expect(content).toEqual("hello\nworld\n");
		expect(nodeOffsetFromIndex(node, -2)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, -1)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, 0)).toEqual([node.childNodes[0], 0]);
		expect(nodeOffsetFromIndex(node, 1)).toEqual([node.childNodes[0], 1]);
		expect(nodeOffsetFromIndex(node, 2)).toEqual([node.childNodes[0], 2]);
		expect(nodeOffsetFromIndex(node, 3)).toEqual([node.childNodes[0], 3]);
		expect(nodeOffsetFromIndex(node, 4)).toEqual([node.childNodes[0], 4]);
		expect(nodeOffsetFromIndex(node, 5)).toEqual([node.childNodes[0], 5]);
		expect(nodeOffsetFromIndex(node, 6)).toEqual([node.childNodes[2], 0]);
		expect(nodeOffsetFromIndex(node, 7)).toEqual([node.childNodes[2], 1]);
		expect(nodeOffsetFromIndex(node, 8)).toEqual([node.childNodes[2], 2]);
		expect(nodeOffsetFromIndex(node, 9)).toEqual([node.childNodes[2], 3]);
		expect(nodeOffsetFromIndex(node, 10)).toEqual([node.childNodes[2], 4]);
		expect(nodeOffsetFromIndex(node, 11)).toEqual([node.childNodes[2], 5]);
		expect(nodeOffsetFromIndex(node, 12)).toEqual([node, 4]);
		expect(nodeOffsetFromIndex(node, 13)).toEqual([node, 4]);
		expect(nodeOffsetFromIndex(node, 14)).toEqual([node, 4]);
		expect(nodeOffsetFromIndex(node, 15)).toEqual([node, 4]);
		for (let i = -3; i < content.length + 3; i++) {
			expect(indexFromNodeOffset(node, ...nodeOffsetFromIndex(node, i))).toBe(
				Math.max(-1, Math.min(i, content.length)),
			);
		}
	});

	test("single br", () => {
		const node = parseHTML("<div><br></div>");
		const content = getContent(node);
		expect(content).toEqual("\n");
		expect(nodeOffsetFromIndex(node, -2)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, -1)).toEqual([null, 0]);
		expect(nodeOffsetFromIndex(node, 0)).toEqual([node, 0]);
		expect(nodeOffsetFromIndex(node, 1)).toEqual([node, 1]);
		for (let i = -3; i < content.length + 3; i++) {
			expect(indexFromNodeOffset(node, ...nodeOffsetFromIndex(node, i))).toBe(
				Math.max(-1, Math.min(i, content.length)),
			);
		}

		// TODO: fix this edge case
		expect(indexFromNodeOffset(node, node.firstChild, 0)).toEqual(0);
	});
});

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

	test("overwriting innerHTML", () => {
		area.innerHTML = "<div>12</div><div>34</div>";
		expect(area.value).toEqual("12\n34\n");
		area.innerHTML = area.innerHTML;
		expect(area.value).toEqual("12\n34\n");
	});

	test("overwriting textContent", () => {
		area.innerHTML = "<div>12</div><div>34</div>";
		expect(area.value).toEqual("12\n34\n");
		area.textContent = area.value;
		expect(area.innerHTML).toEqual(area.textContent);
		expect(area.value).toEqual("12\n34\n");
	});

	test("append div", () => {
		area.innerHTML = "<div><div>12</div><div>34</div></div>";
		expect(area.value).toEqual("12\n34\n");
		(area.firstChild as HTMLElement).insertAdjacentHTML("beforeend", "<div>56</div>");
		expect(area.value).toEqual("12\n34\n56\n");
	});

	test("insert div between divs", () => {
		area.innerHTML = "<div><div>12</div><div>56</div></div>";
		expect(area.value).toEqual("12\n56\n");
		(area.firstChild!.lastChild as HTMLElement).insertAdjacentHTML("beforebegin", "<div>34</div>");
		expect(area.value).toEqual("12\n34\n56\n");
	});

	test("delete first div", () => {
		area.innerHTML = "<div><div>12</div><div>34</div></div>";
		expect(area.value).toEqual("12\n34\n");
		area.firstChild!.childNodes[0].remove();
		expect(area.value).toEqual("34\n");
	});

	test("delete second div", () => {
		area.innerHTML = "<div><div>12</div><div>34</div></div>";
		expect(area.value).toEqual("12\n34\n");
		area.firstChild!.childNodes[1].remove();
		expect(area.value).toEqual("12\n");
	});

	test("delete div between divs", () => {
		area.innerHTML = "<div><div>12</div><div>34</div><div>56</div></div>";
		expect(area.value).toEqual("12\n34\n56\n");
		area.firstChild!.childNodes[1].remove();
		expect(area.value).toEqual("12\n56\n");
	});

	test("delete nested div", () => {
		area.innerHTML =
			"<div><div>12</div><div><div>34</div><div>56</div><div>78</div></div><div>90</div></div>";
		expect(area.value).toEqual("12\n34\n56\n78\n90\n");
		area.firstChild!.childNodes[1].childNodes[1].remove();
		expect(area.value).toEqual("12\n34\n78\n90\n");
	});

	test("text", () => {
		area.innerHTML = "<div><div>12</div><div>56</div></div>";
		expect(area.value).toEqual("12\n56\n");
		const text1 = area.firstChild!.childNodes[0].firstChild! as Text;
		const text2 = area.firstChild!.childNodes[1].firstChild! as Text;
		text1.data = "123";
		text2.data = "456";
		expect(area.value).toEqual("123\n456\n");
	});

	test("add div after text", () => {
		area.innerHTML = "<div>12</div>";
		expect(area.value).toEqual("12\n");
		area.insertAdjacentHTML("beforeend", "<div>34</div>");
		expect(area.value).toEqual("12\n34\n");
	});

	test("delete div after text", () => {
		area.innerHTML = "<div>12<div>34</div></div>";
		expect(area.value).toEqual("12\n34\n");
		area.firstChild!.lastChild!.remove();
		expect(area.value).toEqual("12\n");
	});

	test("delete br at the start of a div after text", () => {
		area.innerHTML = "<div>12<div><br>34</div></div>";
		expect(area.value).toEqual("12\n\n34\n");
		area.firstChild!.lastChild!.firstChild!.remove();
		expect(area.value).toEqual("12\n34\n");
	});
});
