import {suite} from "uvu";
import * as Assert from "uvu/assert";
import {ContentAreaElement} from "../src/contentarea";

let area!: ContentAreaElement;

let test = suite("ContentAreaElement value");
test.before(() => {
	if (!window.customElements.get("content-area")) {
		window.customElements.define("content-area", ContentAreaElement);
	}
});

test.before.each(() => {
	document.body.innerHTML = "<content-area></content-area>";
	area = document.body.firstChild as ContentAreaElement;
});

// value
test("divs", () => {
	area.innerHTML = "<div>Hello</div><div>World</div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("divs with trailing brs", () => {
	area.innerHTML = "<div>Hello<br /></div><div>World<br /></div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("divs in a div", () => {
	area.innerHTML = "<div><div>Hello</div><div>World</div></div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("nested divs", () => {
	area.innerHTML = "<div><div><div>Hello</div></div><div>World</div></div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("br between divs", () => {
	area.innerHTML = "<div><div>Hello</div><br /><div>World</div></div>";
	Assert.is(area.value, "Hello\n\nWorld\n");
});

test("div before text", () => {
	area.innerHTML = "<div><div>Hello</div>World</div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("div after text", () => {
	area.innerHTML = "<div>Hello<div>World</div></div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("nested div before text", () => {
	area.innerHTML = "<div><div><div>Hello</div></div>World</div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("nested div after text and spans", () => {
	area.innerHTML =
		"<div><span>H</span>ell<span>o</span><div><div><span>W</span>orl<span>d</span></div></div></div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("div br between text", () => {
	area.innerHTML = "<div>Hello<div><br></div>World</div>";
	Assert.is(area.value, "Hello\n\nWorld\n");
});

test("empty div", () => {
	area.innerHTML = "<div></div>Hello<div>World</div>";
	Assert.is(area.value, "\nHello\nWorld\n");
});

test("empty div at the end", () => {
	area.innerHTML = "<div>Hello<div>World</div><div></div></div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("span basic", () => {
	area.innerHTML = "<span>Hello World</span>";
	Assert.is(area.value, "Hello World");
});

test("span with br", () => {
	area.innerHTML = "<span>Hello World<br /></span>";
	Assert.is(area.value, "Hello World\n");
});

test("empty span with br at end of div", () => {
	area.innerHTML =
		"<div>Hello<span><br /></span>World<span><br /></span></div>";
	Assert.is(area.value, "Hello\nWorld\n");
});

test("data-content", () => {
	area.innerHTML = '<div>12</div><img data-content="image" /><div>34</div>';
	Assert.is(area.value, "12\nimage\n34\n");
});

test("data-content with children", () => {
	area.innerHTML =
		'<div>12</div><div data-content="widget"><div>ignored</div></div><div>34</div>';
	Assert.is(area.value, "12\nwidget\n34\n");
});

// value after mutations
test("overwriting innerHTML", () => {
	area.innerHTML = "<div>12</div><div>34</div>";
	Assert.is(area.value, "12\n34\n");
	// eslint-disable-next-line no-self-assign
	area.innerHTML = area.innerHTML;
	Assert.is(area.value, "12\n34\n");
});

test("overwriting textContent", () => {
	area.innerHTML = "<div>12</div><div>34</div>";
	Assert.is(area.value, "12\n34\n");
	area.textContent = area.value;
	Assert.is(area.innerHTML, area.textContent);
	Assert.is(area.value, "12\n34\n");
});

test("append div", () => {
	area.innerHTML = "<div><div>12</div><div>34</div></div>";
	Assert.is(area.value, "12\n34\n");
	(area.firstChild as HTMLElement).insertAdjacentHTML(
		"beforeend",
		"<div>56</div>",
	);
	Assert.is(area.value, "12\n34\n56\n");
});

test("insert div between divs", () => {
	area.innerHTML = "<div><div>12</div><div>56</div></div>";
	Assert.is(area.value, "12\n56\n");
	(area.firstChild!.lastChild as HTMLElement).insertAdjacentHTML(
		"beforebegin",
		"<div>34</div>",
	);
	Assert.is(area.value, "12\n34\n56\n");
});

test("delete first div", () => {
	area.innerHTML = "<div><div>12</div><div>34</div></div>";
	Assert.is(area.value, "12\n34\n");
	area.firstChild!.childNodes[0].remove();
	Assert.is(area.value, "34\n");
});

test("delete second div", () => {
	area.innerHTML = "<div><div>12</div><div>34</div></div>";
	Assert.is(area.value, "12\n34\n");
	area.firstChild!.childNodes[1].remove();
	Assert.is(area.value, "12\n");
});

test("delete div between divs", () => {
	area.innerHTML = "<div><div>12</div><div>34</div><div>56</div></div>";
	Assert.is(area.value, "12\n34\n56\n");
	area.firstChild!.childNodes[1].remove();
	Assert.is(area.value, "12\n56\n");
});

test("delete nested div", () => {
	area.innerHTML =
		"<div><div>12</div><div><div>34</div><div>56</div><div>78</div></div><div>90</div></div>";
	Assert.is(area.value, "12\n34\n56\n78\n90\n");
	area.firstChild!.childNodes[1].childNodes[1].remove();
	Assert.is(area.value, "12\n34\n78\n90\n");
});

test("text", () => {
	area.innerHTML = "<div><div>12</div><div>56</div></div>";
	Assert.is(area.value, "12\n56\n");
	const text1 = area.firstChild!.childNodes[0].firstChild! as Text;
	const text2 = area.firstChild!.childNodes[1].firstChild! as Text;
	text1.data = "123";
	text2.data = "456";
	Assert.is(area.value, "123\n456\n");
});

test("add div after text", () => {
	area.innerHTML = "<div>12</div>";
	Assert.is(area.value, "12\n");
	area.insertAdjacentHTML("beforeend", "<div>34</div>");
	Assert.is(area.value, "12\n34\n");
});

test("delete div after text", () => {
	area.innerHTML = "<div>12<div>34</div></div>";
	Assert.is(area.value, "12\n34\n");
	area.firstChild!.lastChild!.remove();
	Assert.is(area.value, "12\n");
});

test("add div between text and div", () => {
	area.innerHTML = "<div>12<div>56</div></div>";
	Assert.is(area.value, "12\n56\n");
	(area.firstChild!.lastChild as Element).insertAdjacentHTML(
		"beforebegin",
		"<div>34</div>",
	);
	Assert.is(area.value, "12\n34\n56\n");
});

test("change text of two adjacent divs", () => {
	area.innerHTML = "<div>12</div><div>34</div>";
	Assert.is(area.value, "12\n34\n");
	area.firstChild!.textContent = "abcd";
	Assert.is(area.value, "abcd\n34\n");
	area.lastChild!.textContent = "efgh";
	Assert.is(area.value, "abcd\nefgh\n");
});

test("change text before div", () => {
	area.innerHTML = "12<div>34</div>";
	Assert.is(area.value, "12\n34\n");
	area.firstChild!.textContent = "abcd";
	Assert.is(area.value, "abcd\n34\n");
	area.firstChild!.textContent = "12";
	Assert.is(area.value, "12\n34\n");
	area.firstChild!.textContent = "abcd";
	Assert.is(area.value, "abcd\n34\n");
});

test("delete br at the start of a div after text", () => {
	area.innerHTML = "<div>12<div><br>34</div></div>";
	Assert.is(area.value, "12\n\n34\n");
	area.firstChild!.lastChild!.firstChild!.remove();
	Assert.is(area.value, "12\n34\n");
});

test("Firefox delete backwards", () => {
	area.innerHTML = "<div>12</div><div><span>34</span></div>";
	Assert.is(area.value, "12\n34\n");
	const div = area.firstChild!;
	div.remove();
	area.firstChild!.insertBefore(div.firstChild!, area.firstChild!.lastChild);
	Assert.is(area.innerHTML, "<div>12<span>34</span></div>");
	Assert.is(area.value, "1234\n");
});

test("data-content changed", () => {
	area.innerHTML = '<div>12</div><img data-content="image" /><div>34</div>';
	Assert.is(area.value, "12\nimage\n34\n");
	(area.childNodes[1] as Element).setAttribute("data-content", "replaced");
	Assert.is(area.value, "12\nreplaced\n34\n");
});

test("data-content with changed children", () => {
	area.innerHTML =
		'<div>12</div><div data-content="widget"><div>ignored</div></div><div>34</div>';
	Assert.is(area.value, "12\nwidget\n34\n");
	area.childNodes[1].firstChild!.remove();
	Assert.is(area.value, "12\nwidget\n34\n");
	(area.childNodes[1] as HTMLElement).insertAdjacentHTML(
		"beforeend",
		"<span>ignored</span>",
	);
});

test("replacing line insertion", () => {
	area.innerHTML = "<div>Hello</div>";
	Assert.is(area.value, "Hello\n");
	area.insertAdjacentHTML("beforeend", "<div>World</div>");
	Assert.is(area.value, "Hello\nWorld\n");
	area.lastChild!.remove();
	(area.firstChild!.firstChild as Text).data = "Hello\nWorld";
	Assert.is(area.innerHTML, "<div>Hello\nWorld</div>");
	Assert.is(area.value, "Hello\nWorld\n");
});

test("tab insertion", () => {
	area.innerHTML = "<div>Hello</div>";
	Assert.is(area.value, "Hello\n");
	area.insertAdjacentHTML("beforeend", "<div>World</div>");
	Assert.is(area.value, "Hello\nWorld\n");
	(area.lastChild as Element).insertAdjacentText("afterbegin", "\t");
	Assert.is(area.innerHTML, "<div>Hello</div><div>\tWorld</div>");
	Assert.is(area.value, "Hello\n\tWorld\n");
});

test("textContent", () => {
	area.innerHTML = "<div>Hello</div>";
	Assert.is(area.value, "Hello\n");
	area.insertAdjacentHTML("beforeend", "<div>World</div>");
	Assert.is(area.value, "Hello\nWorld\n");
	area.lastChild!.remove();
	area.firstChild!.textContent = "Hello\n\nWorld";
	Assert.is(area.innerHTML, "<div>Hello\n\nWorld</div>");
	Assert.is(area.value, "Hello\n\nWorld\n");
});

test("empty inline element edge-case", () => {
	// An edge case when rendering code as such.
	//<pre>
	//  <div><code></code><br></div>
	//  <div><code></code><br></div>
	//</pre>
	area.innerHTML =
		"<pre><div><code></code><br></div><div><code></code><br></div></pre>";
	Assert.is(area.value, "\n\n");
	const pre = area.firstChild;

	const div0 = pre!.childNodes[0];
	const br0 = div0.childNodes[1];
	const div1 = pre!.childNodes[1];

	//<pre>
	//  <div><br><code></code></div>
	//</pre>
	div1.remove();
	br0.remove();
	(div0 as HTMLElement).prepend(document.createElement("br"));
	Assert.is(area.value, "\n");
});

test.run();

test = suite("ContentAreaElement selection logic");
test.before(() => {
	if (!window.customElements.get("content-area")) {
		window.customElements.define("content-area", ContentAreaElement);
	}
});

test.before.each(() => {
	document.body.innerHTML = "<content-area></content-area>";
	area = document.body.firstChild as ContentAreaElement;
});

// nodeOffsetAt/indexAt
test("single line", () => {
	area.innerHTML = "<div><br></div>";
	Assert.is(area.value, "\n");
	const div = area.firstChild!;
	const br = div.firstChild!;
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [div, 0]);
	Assert.equal(area.nodeOffsetAt(1), [area, 1]);
	Assert.is(area.indexAt(area, 0), 0);
	Assert.is(area.indexAt(area, 1), 1);
	Assert.is(area.indexAt(div, 1), 1);
	Assert.is(area.indexAt(br, 0), 0);
	Assert.is(area.indexAt(br, 1), 1);
});

test("two divs", () => {
	// <div>hello</div>
	// <div>world</div>
	area.innerHTML = "<div>hello</div><div>world</div>";
	Assert.is(area.value, "hello\nworld\n");
	const div1 = area.childNodes[0];
	const hello = div1.firstChild;
	const div2 = area.childNodes[1];
	const world = div2.firstChild;
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [world, 0]);
	Assert.equal(area.nodeOffsetAt(7), [world, 1]);
	Assert.equal(area.nodeOffsetAt(8), [world, 2]);
	Assert.equal(area.nodeOffsetAt(9), [world, 3]);
	Assert.equal(area.nodeOffsetAt(10), [world, 4]);
	Assert.equal(area.nodeOffsetAt(11), [world, 5]);
	Assert.equal(area.nodeOffsetAt(12), [area, 2]);
	Assert.is(area.indexAt(area, 0), 0);
	Assert.is(area.indexAt(area, 1), 6);
	Assert.is(area.indexAt(area, 2), 12);
	Assert.is(area.indexAt(div1, 0), 0);
	Assert.is(area.indexAt(div1, 1), 5);
	Assert.is(area.indexAt(div2, 0), 6);
	Assert.is(area.indexAt(div2, 1), 11);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("two divs in div", () => {
	// <div>
	//   <div>hello</div>
	//   <div>world</div>
	// </div>
	area.innerHTML = "<div><div>hello</div><div>world</div></div>";
	Assert.is(area.value, "hello\nworld\n");
	const root = area.firstChild!;
	const div1 = root.childNodes[0];
	const hello = div1.firstChild;
	const div2 = root.childNodes[1];
	const world = div2.firstChild;
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	// TODO: Why is the node the element and not the text?
	Assert.equal(area.nodeOffsetAt(6), [world, 0]);
	Assert.equal(area.nodeOffsetAt(7), [world, 1]);
	Assert.equal(area.nodeOffsetAt(8), [world, 2]);
	Assert.equal(area.nodeOffsetAt(9), [world, 3]);
	Assert.equal(area.nodeOffsetAt(10), [world, 4]);
	Assert.equal(area.nodeOffsetAt(11), [world, 5]);
	Assert.equal(area.nodeOffsetAt(12), [area, 1]);
	Assert.is(area.indexAt(root, 0), 0);
	Assert.is(area.indexAt(root, 1), 6);
	Assert.is(area.indexAt(root, 2), 12);
	Assert.is(area.indexAt(div1, 0), 0);
	Assert.is(area.indexAt(div1, 1), 5);
	Assert.is(area.indexAt(div2, 0), 6);
	Assert.is(area.indexAt(div2, 1), 11);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("div after text", () => {
	// hello
	// <div>world</div>
	area.innerHTML = "hello<div>world</div>";
	Assert.is(area.value, "hello\nworld\n");
	const hello = area.childNodes[0];
	const div = area.childNodes[1];
	const world = div.firstChild!;
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [world, 0]);
	Assert.equal(area.nodeOffsetAt(7), [world, 1]);
	Assert.equal(area.nodeOffsetAt(8), [world, 2]);
	Assert.equal(area.nodeOffsetAt(9), [world, 3]);
	Assert.equal(area.nodeOffsetAt(10), [world, 4]);
	Assert.equal(area.nodeOffsetAt(11), [world, 5]);
	Assert.equal(area.nodeOffsetAt(12), [area, 2]);
	Assert.is(area.indexAt(area, 0), 0);
	Assert.is(area.indexAt(area, 1), 5);
	Assert.is(area.indexAt(area, 2), 12);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("div after text in div", () => {
	// <div>
	//   hello
	//   <div>world</div>
	// </div>
	area.innerHTML = "<div>hello<div>world</div></div>";
	Assert.is(area.value, "hello\nworld\n");
	const div1 = area.firstChild!;
	const hello = div1.childNodes[0];
	const div2 = div1.childNodes[1];
	const world = div2.firstChild!;
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [world, 0]);
	Assert.equal(area.nodeOffsetAt(7), [world, 1]);
	Assert.equal(area.nodeOffsetAt(8), [world, 2]);
	Assert.equal(area.nodeOffsetAt(9), [world, 3]);
	Assert.equal(area.nodeOffsetAt(10), [world, 4]);
	Assert.equal(area.nodeOffsetAt(11), [world, 5]);
	Assert.equal(area.nodeOffsetAt(12), [area, 1]);
	Assert.is(area.indexAt(div1, 0), 0);
	// This is mildly surprising, but it reflects the behavior of the
	// selection.collapse().
	Assert.is(area.indexAt(div1, 1), 5);
	Assert.is(area.indexAt(div1, 2), 12);
	Assert.is(area.indexAt(div2, 0), 6);
	Assert.is(area.indexAt(div2, 1), 11);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("div after text in div after text", () => {
	// <div>
	//   hello
	//   <div>
	//     world
	//     <div>third</div>
	//   </div>
	// </div>
	area.innerHTML = "<div>hello<div>world<div>third</div></div></div>";
	Assert.is(area.value, "hello\nworld\nthird\n");
	const div1 = area.firstChild!;
	const hello = div1.childNodes[0];
	const div2 = div1.childNodes[1];
	const world = div2.childNodes[0];
	const div3 = div2.childNodes[1];
	const third = div3.firstChild!;
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [world, 0]);
	Assert.equal(area.nodeOffsetAt(7), [world, 1]);
	Assert.equal(area.nodeOffsetAt(8), [world, 2]);
	Assert.equal(area.nodeOffsetAt(9), [world, 3]);
	Assert.equal(area.nodeOffsetAt(10), [world, 4]);
	Assert.equal(area.nodeOffsetAt(11), [world, 5]);
	Assert.equal(area.nodeOffsetAt(12), [third, 0]);
	Assert.equal(area.nodeOffsetAt(13), [third, 1]);
	Assert.equal(area.nodeOffsetAt(14), [third, 2]);
	Assert.equal(area.nodeOffsetAt(15), [third, 3]);
	Assert.equal(area.nodeOffsetAt(16), [third, 4]);
	Assert.equal(area.nodeOffsetAt(17), [third, 5]);
	Assert.equal(area.nodeOffsetAt(18), [area, 1]);
	Assert.is(area.indexAt(area, 0), 0);
	Assert.is(area.indexAt(area, 1), 18);
	Assert.is(area.indexAt(div1, 0), 0);
	Assert.is(area.indexAt(div1, 1), 5);
	Assert.is(area.indexAt(div1, 2), 18);
	Assert.is(area.indexAt(div2, 0), 6);
	Assert.is(area.indexAt(div2, 1), 11);
	Assert.is(area.indexAt(div2, 2), 18);
	Assert.is(area.indexAt(div3, 0), 12);
	Assert.is(area.indexAt(div3, 1), 17);
	Assert.is(area.indexAt(hello, 0), 0);
	Assert.is(area.indexAt(hello, 1), 1);
	Assert.is(area.indexAt(hello, 2), 2);
	Assert.is(area.indexAt(hello, 3), 3);
	Assert.is(area.indexAt(hello, 4), 4);
	Assert.is(area.indexAt(hello, 5), 5);
	Assert.is(area.indexAt(world, 0), 6);
	Assert.is(area.indexAt(world, 1), 7);
	Assert.is(area.indexAt(world, 2), 8);
	Assert.is(area.indexAt(world, 3), 9);
	Assert.is(area.indexAt(world, 4), 10);
	Assert.is(area.indexAt(world, 5), 11);
	Assert.is(area.indexAt(third, 0), 12);
	Assert.is(area.indexAt(third, 1), 13);
	Assert.is(area.indexAt(third, 2), 14);
	Assert.is(area.indexAt(third, 3), 15);
	Assert.is(area.indexAt(third, 4), 16);
	Assert.is(area.indexAt(third, 5), 17);
	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("double br", () => {
	// <div>
	//   hello<br>
	//   <br>
	//   world
	// </div>
	area.innerHTML = "<div>hello<br><br>world</div>";
	Assert.is(area.value, "hello\n\nworld\n");
	const div = area.firstChild!;
	const hello = div.childNodes[0];
	const br1 = div.childNodes[1];
	const br2 = div.childNodes[2];
	const world = div.childNodes[3];
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [div, 2]);
	Assert.equal(area.nodeOffsetAt(7), [world, 0]);
	Assert.equal(area.nodeOffsetAt(8), [world, 1]);
	Assert.equal(area.nodeOffsetAt(9), [world, 2]);
	Assert.equal(area.nodeOffsetAt(10), [world, 3]);
	Assert.equal(area.nodeOffsetAt(11), [world, 4]);
	Assert.equal(area.nodeOffsetAt(12), [world, 5]);
	Assert.equal(area.nodeOffsetAt(13), [area, 1]);
	Assert.is(area.indexAt(div, 0), 0);
	Assert.is(area.indexAt(div, 1), 5);
	Assert.is(area.indexAt(div, 2), 6);
	Assert.is(area.indexAt(div, 3), 7);
	Assert.is(area.indexAt(div, 4), 12);
	Assert.is(area.indexAt(br1, 0), 5);
	Assert.is(area.indexAt(br1, 1), 6);
	Assert.is(area.indexAt(br2, 0), 6);
	Assert.is(area.indexAt(br2, 1), 7);
	Assert.is(area.indexAt(hello, 0), 0);
	Assert.is(area.indexAt(hello, 1), 1);
	Assert.is(area.indexAt(hello, 2), 2);
	Assert.is(area.indexAt(hello, 3), 3);
	Assert.is(area.indexAt(hello, 4), 4);
	Assert.is(area.indexAt(hello, 5), 5);
	Assert.is(area.indexAt(world, 0), 7);
	Assert.is(area.indexAt(world, 1), 8);
	Assert.is(area.indexAt(world, 2), 9);
	Assert.is(area.indexAt(world, 3), 10);
	Assert.is(area.indexAt(world, 4), 11);
	Assert.is(area.indexAt(world, 5), 12);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("divs with brs", () => {
	// <div>
	//   <div>hello<br></div>
	//   <div>world<br></div>
	// </div>
	area.innerHTML = "<div><div>hello<br></div><div>world<br></div></div>";
	Assert.is(area.value, "hello\nworld\n");
	const root = area.firstChild!;
	const div1 = root.childNodes[0];
	const hello = div1.childNodes[0];
	const br1 = div1.childNodes[1];
	const div2 = root.childNodes[1];
	const world = div2.childNodes[0];
	const br2 = div2.childNodes[1];
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [world, 0]);
	Assert.equal(area.nodeOffsetAt(7), [world, 1]);
	Assert.equal(area.nodeOffsetAt(8), [world, 2]);
	Assert.equal(area.nodeOffsetAt(9), [world, 3]);
	Assert.equal(area.nodeOffsetAt(10), [world, 4]);
	Assert.equal(area.nodeOffsetAt(11), [world, 5]);
	Assert.equal(area.nodeOffsetAt(12), [area, 1]);
	Assert.is(area.indexAt(area, 0), 0);
	Assert.is(area.indexAt(area, 1), 12);
	Assert.is(area.indexAt(root, 0), 0);
	Assert.is(area.indexAt(root, 1), 6);
	Assert.is(area.indexAt(root, 2), 12);
	Assert.is(area.indexAt(hello, 0), 0);
	Assert.is(area.indexAt(hello, 1), 1);
	Assert.is(area.indexAt(hello, 2), 2);
	Assert.is(area.indexAt(hello, 3), 3);
	Assert.is(area.indexAt(hello, 4), 4);
	Assert.is(area.indexAt(hello, 5), 5);
	Assert.is(area.indexAt(br1, 0), 5);
	Assert.is(area.indexAt(br1, 1), 6);
	Assert.is(area.indexAt(world, 0), 6);
	Assert.is(area.indexAt(world, 1), 7);
	Assert.is(area.indexAt(world, 2), 8);
	Assert.is(area.indexAt(world, 3), 9);
	Assert.is(area.indexAt(world, 4), 10);
	Assert.is(area.indexAt(world, 5), 11);
	Assert.is(area.indexAt(br2, 0), 11);
	Assert.is(area.indexAt(br2, 1), 12);
	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("text with br after", () => {
	// <div>
	//   hello<br>
	//   world<br>
	// </div>
	area.innerHTML = "<div>hello<br>world<br></div>";
	Assert.is(area.value, "hello\nworld\n");
	const div = area.firstChild!;
	const hello = div.childNodes[0];
	const br1 = div.childNodes[1];
	const world = div.childNodes[2];
	const br2 = div.childNodes[3];
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [world, 0]);
	Assert.equal(area.nodeOffsetAt(7), [world, 1]);
	Assert.equal(area.nodeOffsetAt(8), [world, 2]);
	Assert.equal(area.nodeOffsetAt(9), [world, 3]);
	Assert.equal(area.nodeOffsetAt(10), [world, 4]);
	Assert.equal(area.nodeOffsetAt(11), [world, 5]);
	Assert.equal(area.nodeOffsetAt(13), [area, 1]);
	Assert.is(area.indexAt(div, 0), 0);
	Assert.is(area.indexAt(div, 1), 5);
	Assert.is(area.indexAt(div, 2), 6);
	Assert.is(area.indexAt(div, 3), 11);
	Assert.is(area.indexAt(div, 4), 12);
	Assert.is(area.indexAt(br1, 0), 5);
	Assert.is(area.indexAt(br1, 1), 6);
	Assert.is(area.indexAt(br2, 0), 11);
	Assert.is(area.indexAt(br2, 1), 12);
	Assert.is(area.indexAt(hello, 0), 0);
	Assert.is(area.indexAt(hello, 1), 1);
	Assert.is(area.indexAt(hello, 2), 2);
	Assert.is(area.indexAt(hello, 3), 3);
	Assert.is(area.indexAt(hello, 4), 4);
	Assert.is(area.indexAt(hello, 5), 5);
	Assert.is(area.indexAt(world, 0), 6);
	Assert.is(area.indexAt(world, 1), 7);
	Assert.is(area.indexAt(world, 2), 8);
	Assert.is(area.indexAt(world, 3), 9);
	Assert.is(area.indexAt(world, 4), 10);
	Assert.is(area.indexAt(world, 5), 11);
	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("multiple spans", () => {
	area.innerHTML =
		"<span>h</span>ell<span>o</span> <span>w</span>orl<span>d</span>";
	Assert.is(area.value, "hello world");
	const span1 = area.childNodes[0];
	const h = span1.firstChild!;
	const ell = area.childNodes[1];
	const span2 = area.childNodes[2];
	const o = span2.firstChild!;
	const space = area.childNodes[3];
	const span3 = area.childNodes[4];
	const w = span3.firstChild!;
	const orl = area.childNodes[5];
	const span4 = area.childNodes[6];
	const d = span4.firstChild!;
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [h, 0]);
	Assert.equal(area.nodeOffsetAt(1), [ell, 0]);
	Assert.equal(area.nodeOffsetAt(2), [ell, 1]);
	Assert.equal(area.nodeOffsetAt(3), [ell, 2]);
	Assert.equal(area.nodeOffsetAt(4), [ell, 3]);
	Assert.equal(area.nodeOffsetAt(5), [space, 0]);
	Assert.equal(area.nodeOffsetAt(6), [space, 1]);
	Assert.equal(area.nodeOffsetAt(7), [orl, 0]);
	Assert.equal(area.nodeOffsetAt(8), [orl, 1]);
	Assert.equal(area.nodeOffsetAt(9), [orl, 2]);
	Assert.equal(area.nodeOffsetAt(10), [orl, 3]);
	Assert.equal(area.nodeOffsetAt(11), [area, 7]);

	Assert.is(area.indexAt(span1, 0), 0);
	Assert.is(area.indexAt(span1, 1), 1);
	Assert.is(area.indexAt(h, 0), 0);
	Assert.is(area.indexAt(h, 1), 1);
	Assert.is(area.indexAt(ell, 0), 1);
	Assert.is(area.indexAt(ell, 1), 2);
	Assert.is(area.indexAt(ell, 2), 3);
	Assert.is(area.indexAt(ell, 3), 4);
	Assert.is(area.indexAt(span2, 0), 4);
	Assert.is(area.indexAt(span2, 1), 5);
	Assert.is(area.indexAt(o, 0), 4);
	Assert.is(area.indexAt(o, 1), 5);
	Assert.is(area.indexAt(span3, 0), 6);
	Assert.is(area.indexAt(span3, 1), 7);
	Assert.is(area.indexAt(w, 0), 6);
	Assert.is(area.indexAt(w, 1), 7);
	Assert.is(area.indexAt(orl, 0), 7);
	Assert.is(area.indexAt(orl, 1), 8);
	Assert.is(area.indexAt(orl, 2), 9);
	Assert.is(area.indexAt(orl, 3), 10);
	Assert.is(area.indexAt(span4, 0), 10);
	Assert.is(area.indexAt(span4, 1), 11);
	Assert.is(area.indexAt(d, 0), 10);
	Assert.is(area.indexAt(d, 1), 11);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i)),
		);
	}
});

test("data content", () => {
	//<div>Hello <img> World <img></div>
	area.innerHTML =
		'<div>hello <img data-content="👋"> world <img data-content="🌎"></div>';

	Assert.is(area.value, "hello 👋 world 🌎\n");
	const div = area.firstChild!;
	const hello = div.childNodes[0];
	const wave = div.childNodes[1];
	const world = div.childNodes[2];
	const globe = div.childNodes[3];
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [hello, 6]);
	// TODO: It would be nice to have the node be a text node here.
	Assert.equal(area.nodeOffsetAt(7), [div, 2]);
	Assert.equal(area.nodeOffsetAt(8), [world, 0]);
	Assert.equal(area.nodeOffsetAt(9), [world, 1]);
	Assert.equal(area.nodeOffsetAt(10), [world, 2]);
	Assert.equal(area.nodeOffsetAt(11), [world, 3]);
	Assert.equal(area.nodeOffsetAt(12), [world, 4]);
	Assert.equal(area.nodeOffsetAt(13), [world, 5]);
	Assert.equal(area.nodeOffsetAt(14), [world, 6]);
	Assert.equal(area.nodeOffsetAt(15), [world, 7]);
	Assert.equal(area.nodeOffsetAt(16), [div, 4]);
	Assert.equal(area.nodeOffsetAt(17), [div, 4]);
	Assert.equal(area.nodeOffsetAt(18), [area, 1]);

	Assert.is(area.indexAt(div, 0), 0);
	Assert.is(area.indexAt(div, 1), 6);
	Assert.is(area.indexAt(div, 2), 8);
	Assert.is(area.indexAt(div, 3), 15);
	Assert.is(area.indexAt(div, 4), 17);
	Assert.is(area.indexAt(hello, 0), 0);
	Assert.is(area.indexAt(hello, 1), 1);
	Assert.is(area.indexAt(hello, 2), 2);
	Assert.is(area.indexAt(hello, 3), 3);
	Assert.is(area.indexAt(hello, 4), 4);
	Assert.is(area.indexAt(hello, 5), 5);
	Assert.is(area.indexAt(hello, 6), 6);
	Assert.is(area.indexAt(wave, 0), 6);
	Assert.is(area.indexAt(wave, 1), 8);
	Assert.is(area.indexAt(world, 0), 8);
	Assert.is(area.indexAt(world, 1), 9);
	Assert.is(area.indexAt(world, 2), 10);
	Assert.is(area.indexAt(world, 3), 11);
	Assert.is(area.indexAt(world, 4), 12);
	Assert.is(area.indexAt(world, 5), 13);
	Assert.is(area.indexAt(world, 6), 14);
	Assert.is(area.indexAt(world, 7), 15);
	Assert.is(area.indexAt(globe, 0), 15);
	Assert.is(area.indexAt(globe, 1), 17);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(
				-1,
				Math.min(area.value.length, i === 7 ? 8 : i === 16 ? 17 : i),
			),
		);
	}
});

test("data-content before end of line", () => {
	//<div>
	//  <div>Hello <img></div>
	//  <div><br></div>
	//  <div><br></div>
	//</div>
	area.innerHTML =
		'<div><div>Hello <img data-content="🌎"></div><div class="1"><br></div><div class="2"><br></div></div>';
	Assert.is(area.value, "Hello 🌎\n\n\n");
	const root = area.firstChild!;
	const div1 = root.childNodes[0];
	const hello = div1.childNodes[0];
	const img = div1.childNodes[1];
	const div2 = root.childNodes[1];
	const div3 = root.childNodes[2];
	Assert.equal(area.nodeOffsetAt(-1), [null, 0]);
	Assert.equal(area.nodeOffsetAt(0), [hello, 0]);
	Assert.equal(area.nodeOffsetAt(1), [hello, 1]);
	Assert.equal(area.nodeOffsetAt(2), [hello, 2]);
	Assert.equal(area.nodeOffsetAt(3), [hello, 3]);
	Assert.equal(area.nodeOffsetAt(4), [hello, 4]);
	Assert.equal(area.nodeOffsetAt(5), [hello, 5]);
	Assert.equal(area.nodeOffsetAt(6), [hello, 6]);
	Assert.equal(area.nodeOffsetAt(7), [div1, 2]);
	Assert.equal(area.nodeOffsetAt(8), [div1, 2]);
	Assert.equal(area.nodeOffsetAt(9), [div2, 0]);
	Assert.equal(area.nodeOffsetAt(10), [div3, 0]);
	Assert.equal(area.nodeOffsetAt(11), [area, 1]);

	Assert.is(area.indexAt(div1, 0), 0);
	Assert.is(area.indexAt(div1, 1), 6);
	Assert.is(area.indexAt(div1, 2), 8);
	Assert.is(area.indexAt(hello, 0), 0);
	Assert.is(area.indexAt(hello, 1), 1);
	Assert.is(area.indexAt(hello, 2), 2);
	Assert.is(area.indexAt(hello, 3), 3);
	Assert.is(area.indexAt(hello, 4), 4);
	Assert.is(area.indexAt(hello, 5), 5);
	Assert.is(area.indexAt(img, 0), 6);
	Assert.is(area.indexAt(img, 1), 8);
	Assert.is(area.indexAt(div2, 0), 9);
	Assert.is(area.indexAt(div2, 1), 10);
	Assert.is(area.indexAt(div3, 0), 10);
	Assert.is(area.indexAt(div3, 1), 11);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(
				-1,
				Math.min(
					area.value.length,
					// When i === 7, we are indexing the second byte of the 🌎,
					// according to utf-16 code units, so the nodeOffset returned is
					// the parent div of the img, with an offset equal to the number
					// of child nodes for this parent div.
					i === 7 ? 8 : i,
				),
			),
		);
	}
});

test("data-content with different children", () => {
	// <div>
	//   aa<span data-content="bb"><span>double b</span></span>cc
	// </div>
	area.innerHTML =
		'<div>aa<span data-content="bb"><span>double b</span></span>cc</div>';
	Assert.is(area.value, "aabbcc\n");
	const div = area.childNodes[0];
	const aa = div.childNodes[0];
	const span1 = div.childNodes[1];
	const cc = div.childNodes[2];
	const span2 = span1.firstChild;

	Assert.equal(area.nodeOffsetAt(0), [aa, 0]);
	Assert.equal(area.nodeOffsetAt(1), [aa, 1]);
	Assert.equal(area.nodeOffsetAt(2), [aa, 2]);
	Assert.equal(area.nodeOffsetAt(3), [div, 2]);
	Assert.equal(area.nodeOffsetAt(4), [cc, 0]);
	Assert.equal(area.nodeOffsetAt(5), [cc, 1]);
	Assert.equal(area.nodeOffsetAt(6), [cc, 2]);
	Assert.equal(area.nodeOffsetAt(7), [area, 1]);

	Assert.is(area.indexAt(span1, 0), 2);
	Assert.is(area.indexAt(span1, 1), 4);
	Assert.is(area.indexAt(span2, 0), 2);
	Assert.is(area.indexAt(span2, 1), 2);
	Assert.is(area.indexAt(span2, 3), 2);
	Assert.is(area.indexAt(span2, 4), 2);
	Assert.is(area.indexAt(span2, 5), 2);
	Assert.is(area.indexAt(span2, 6), 2);
	Assert.is(area.indexAt(span2, 7), 2);
	Assert.is(area.indexAt(span2, 8), 2);

	for (let i = -1; i < area.value.length + 1; i++) {
		Assert.is(
			area.indexAt(...area.nodeOffsetAt(i)),
			Math.max(-1, Math.min(area.value.length, i === 3 ? 4 : i)),
		);
	}
});

test.run();
