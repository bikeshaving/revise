import {
	getContent,
	invalidate,
	indexFromNodeOffset,
	nodeOffsetFromIndex,
} from "../content-observer";

function parseHTML(text: string): Node {
	const fragment = document.createRange().createContextualFragment(text);
	if (fragment.childNodes.length === 0) {
		throw new Error("No parsed nodes");
	} else if (fragment.childNodes.length > 1) {
		return fragment;
	}

	return fragment.firstChild!;
}

describe("content", () => {
	test("divs basic", () => {
		const node = parseHTML("<div><div>Hello</div><div>World</div></div>");
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
		const node = parseHTML(
			"<div><div><div>Hello</div></div><div>World</div></div>",
		);
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("br between divs", () => {
		const node = parseHTML("<div><div>Hello</div><br /><div>World</div></div>");
		expect(getContent(node)).toEqual("Hello\n\nWorld\n");
	});

	test("div before text", () => {
		const node = parseHTML("<div><div>Hello</div>World</div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("div after text", () => {
		const node = parseHTML("<div>Hello<div>World</div></div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("nested div before text", () => {
		const node = parseHTML("<div><div><div>Hello</div></div>World</div>");
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("nested div after text and spans", () => {
		const node = parseHTML(
			"<div><span>H</span>ell<span>o</span><div><div><span>W</span>orl<span>d</span></div></div></div>",
		);
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});

	test("div br between text", () => {
		const node = parseHTML("<div>Hello<div><br></div>World</div>");
		expect(getContent(node)).toEqual("Hello\n\nWorld\n");
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

	test("empty span with br at end of div", () => {
		const node = parseHTML(
			"<div>Hello<span><br /></span>World<span><br /></span></div>",
		);
		expect(getContent(node)).toEqual("Hello\nWorld\n");
	});
});

describe("incremental", () => {
	test("append div", () => {
		const node = parseHTML("<div><div>12</div><div>34</div></div>");
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n34\n");
		node.appendChild(parseHTML("<div>56</div>"));
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n34\n56\n");
	});

	test("insert div between divs", () => {
		const node = parseHTML("<div><div>12</div><div>56</div></div>");
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n56\n");
		node.insertBefore(parseHTML("<div>34</div>"), node.lastChild);
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n34\n56\n");
	});

	test("delete first div", () => {
		const node = parseHTML("<div><div>12</div><div>34</div></div>");
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n34\n");
		node.childNodes[0].remove();
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("34\n");
	});

	test("delete second div", () => {
		const node = parseHTML("<div><div>12</div><div>34</div></div>");
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n34\n");
		node.childNodes[1].remove();
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n");
	});

	test("delete div between existing divs", () => {
		const node = parseHTML(
			"<div><div>12</div><div>34</div><div>56</div></div>",
		);
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n34\n56\n");
		node.childNodes[1].remove();
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n56\n");
	});

	test("delete nested delete", () => {
		const node = parseHTML(
			"<div><div>12</div><div><div>34</div><div>56</div><div>78</div></div><div>90</div></div>",
		);

		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n34\n56\n78\n90\n");
		node.childNodes[1].childNodes[1].remove();
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n34\n78\n90\n");
	});

	test("text", () => {
		const node = parseHTML("<div><div>12</div><div>56</div></div>");

		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});

		const content1 = getContent(node);
		expect(content1).toEqual("12\n56\n");
		const text1 = node.childNodes[0].firstChild! as Text;
		const text2 = node.childNodes[1].firstChild! as Text;
		text1.data = "123";
		text2.data = "456";
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("123\n456\n");
	});

	test("add div after text", () => {
		const node = parseHTML("<div>12</div>");
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n");
		node.appendChild(parseHTML("<div>34</div>"));
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n34\n");
	});

	test("delete div after text", () => {
		const node = parseHTML("<div>12<div>34</div></div>");
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n34\n");
		node.removeChild(node.lastChild!);
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n");
	});

	test("delete br at the start of a div after text", () => {
		const node = parseHTML("<div>12<div><br>34</div></div>");
		const observer = new MutationObserver(() => {});
		observer.observe(node, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		const content1 = getContent(node);
		expect(content1).toEqual("12\n\n34\n");
		node.lastChild!.firstChild!.remove();
		invalidate(node, observer.takeRecords());
		expect(getContent(node, content1)).toEqual("12\n34\n");
	});
});

describe("nodeOffset/index conversions", () => {
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

		expect(indexFromNodeOffset(node, node.firstChild, 0)).toEqual(0);
	});
});
