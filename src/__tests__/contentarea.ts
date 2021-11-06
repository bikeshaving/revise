import {ContentAreaElement} from "../contentarea";
describe("contentarea", () => {
	let area!: ContentAreaElement;
	beforeAll(() => {
		window.customElements.define("content-area", ContentAreaElement);
	});

	beforeEach(() => {
		document.body.innerHTML = "<content-area></content-area>";
		area = document.body.firstChild as ContentAreaElement;
	});

	describe("value", () => {
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
			expect(area.value).toEqual("\nHello\nWorld\n");
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

		test("data-content", () => {
			area.innerHTML = '<div>12</div><img data-content="image" /><div>34</div>';
			expect(area.value).toEqual("12\nimage\n34\n");
		});

		test("data-content with children", () => {
			area.innerHTML =
				'<div>12</div><div data-content="widget"><div>ignored</div></div><div>34</div>';
			expect(area.value).toEqual("12\nwidget\n34\n");
		});
	});

	describe("value after mutations", () => {
		test("overwriting innerHTML", () => {
			area.innerHTML = "<div>12</div><div>34</div>";
			expect(area.value).toEqual("12\n34\n");
			// eslint-disable-next-line no-self-assign
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
			(area.firstChild as HTMLElement).insertAdjacentHTML(
				"beforeend",
				"<div>56</div>",
			);
			expect(area.value).toEqual("12\n34\n56\n");
		});

		test("insert div between divs", () => {
			area.innerHTML = "<div><div>12</div><div>56</div></div>";
			expect(area.value).toEqual("12\n56\n");
			(area.firstChild!.lastChild as HTMLElement).insertAdjacentHTML(
				"beforebegin",
				"<div>34</div>",
			);
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

		test("add div between text and div", () => {
			area.innerHTML = "<div>12<div>56</div></div>";
			expect(area.value).toEqual("12\n56\n");
			(area.firstChild!.lastChild as Element).insertAdjacentHTML(
				"beforebegin",
				"<div>34</div>",
			);
			expect(area.value).toEqual("12\n34\n56\n");
		});

		test("change text of two adjacent divs", () => {
			area.innerHTML = "<div>12</div><div>34</div>";
			expect(area.value).toEqual("12\n34\n");
			area.firstChild!.textContent = "abcd";
			expect(area.value).toEqual("abcd\n34\n");
			area.lastChild!.textContent = "efgh";
			expect(area.value).toEqual("abcd\nefgh\n");
		});

		test("change text before div", () => {
			area.innerHTML = "12<div>34</div>";
			expect(area.value).toEqual("12\n34\n");
			area.firstChild!.textContent = "abcd";
			expect(area.value).toEqual("abcd\n34\n");
			area.firstChild!.textContent = "12";
			expect(area.value).toEqual("12\n34\n");
			area.firstChild!.textContent = "abcd";
			expect(area.value).toEqual("abcd\n34\n");
		});

		test("delete br at the start of a div after text", () => {
			area.innerHTML = "<div>12<div><br>34</div></div>";
			expect(area.value).toEqual("12\n\n34\n");
			area.firstChild!.lastChild!.firstChild!.remove();
			expect(area.value).toEqual("12\n34\n");
		});

		test("Firefox delete backwards", () => {
			area.innerHTML = "<div>12</div><div><span>34</span></div>";
			expect(area.value).toEqual("12\n34\n");
			const div = area.firstChild!;
			div.remove();
			area.firstChild!.insertBefore(
				div.firstChild!,
				area.firstChild!.lastChild,
			);
			expect(area.innerHTML).toEqual("<div>12<span>34</span></div>");
			expect(area.value).toEqual("1234\n");
		});

		test("data-content changed", () => {
			area.innerHTML = '<div>12</div><img data-content="image" /><div>34</div>';
			expect(area.value).toEqual("12\nimage\n34\n");
			(area.childNodes[1] as Element).setAttribute("data-content", "replaced");
			expect(area.value).toEqual("12\nreplaced\n34\n");
		});

		test("data-content with changed children", () => {
			area.innerHTML =
				'<div>12</div><div data-content="widget"><div>ignored</div></div><div>34</div>';
			expect(area.value).toEqual("12\nwidget\n34\n");
			area.childNodes[1].firstChild!.remove();
			expect(area.value).toEqual("12\nwidget\n34\n");
			(area.childNodes[1] as HTMLElement).insertAdjacentHTML(
				"beforeend",
				"<span>ignored</span>",
			);
		});

		test("replacing line insertion", () => {
			area.innerHTML = "<div>Hello</div>";
			expect(area.value).toEqual("Hello\n");
			area.insertAdjacentHTML("beforeend", "<div>World</div>");
			expect(area.value).toEqual("Hello\nWorld\n");
			area.lastChild!.remove();
			(area.firstChild!.firstChild as Text).data = "Hello\nWorld";
			expect(area.innerHTML).toEqual("<div>Hello\nWorld</div>");
			expect(area.value).toEqual("Hello\nWorld\n");
		});

		test("tab insertion", () => {
			area.innerHTML = "<div>Hello</div>";
			expect(area.value).toEqual("Hello\n");
			area.insertAdjacentHTML("beforeend", "<div>World</div>");
			expect(area.value).toEqual("Hello\nWorld\n");
			(area.lastChild as Element).insertAdjacentText("afterbegin", "\t");
			expect(area.innerHTML).toEqual("<div>Hello</div><div>\tWorld</div>");
			expect(area.value).toEqual("Hello\n\tWorld\n");
		});

		test("textContent", () => {
			area.innerHTML = "<div>Hello</div>";
			expect(area.value).toEqual("Hello\n");
			area.insertAdjacentHTML("beforeend", "<div>World</div>");
			expect(area.value).toEqual("Hello\nWorld\n");
			area.lastChild!.remove();
			area.firstChild!.textContent = "Hello\n\nWorld";
			expect(area.innerHTML).toEqual("<div>Hello\n\nWorld</div>");
			expect(area.value).toEqual("Hello\n\nWorld\n");
		});

		test("empty inline element edge-case", () => {
			// An edge case when rendering code as such.
			//<pre>
			//  <div><code></code><br></div>
			//  <div><code></code><br></div>
			//</pre>
			area.innerHTML =
				"<pre><div><code></code><br></div><div><code></code><br></div></pre>";
			expect(area.value).toBe("\n\n");
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
			expect(area.value).toBe("\n");
		});
	});

	describe("nodeOffsetAt/indexAt", () => {
		test("single line", () => {
			area.innerHTML = "<div><br></div>";
			expect(area.value).toEqual("\n");
			const div = area.firstChild!;
			const br = div.firstChild!;
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([div, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([area, 1]);
			expect(area.indexAt(area, 0)).toBe(0);
			expect(area.indexAt(area, 1)).toBe(1);
			expect(area.indexAt(div, 1)).toBe(1);
			expect(area.indexAt(br, 0)).toBe(0);
			expect(area.indexAt(br, 1)).toBe(1);
		});

		test("two divs", () => {
			// <div>hello</div>
			// <div>world</div>
			area.innerHTML = "<div>hello</div><div>world</div>";
			expect(area.value).toEqual("hello\nworld\n");
			const div1 = area.childNodes[0];
			const hello = div1.firstChild;
			const div2 = area.childNodes[1];
			const world = div2.firstChild;
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(12)).toEqual([area, 2]);
			expect(area.indexAt(area, 0)).toBe(0);
			expect(area.indexAt(area, 1)).toBe(6);
			expect(area.indexAt(area, 2)).toBe(12);
			expect(area.indexAt(div1, 0)).toBe(0);
			expect(area.indexAt(div1, 1)).toBe(5);
			expect(area.indexAt(div2, 0)).toBe(6);
			expect(area.indexAt(div2, 1)).toBe(11);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
			expect(area.value).toEqual("hello\nworld\n");
			const root = area.firstChild!;
			const div1 = root.childNodes[0];
			const hello = div1.firstChild;
			const div2 = root.childNodes[1];
			const world = div2.firstChild;
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			// TODO: Why is the node the element and not the text?
			expect(area.nodeOffsetAt(6)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(12)).toEqual([area, 1]);
			expect(area.indexAt(root, 0)).toBe(0);
			expect(area.indexAt(root, 1)).toBe(6);
			expect(area.indexAt(root, 2)).toBe(12);
			expect(area.indexAt(div1, 0)).toBe(0);
			expect(area.indexAt(div1, 1)).toBe(5);
			expect(area.indexAt(div2, 0)).toBe(6);
			expect(area.indexAt(div2, 1)).toBe(11);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(area.value.length, i)),
				);
			}
		});

		test("div after text", () => {
			// hello
			// <div>world</div>
			area.innerHTML = "hello<div>world</div>";
			expect(area.value).toEqual("hello\nworld\n");
			const hello = area.childNodes[0];
			const div = area.childNodes[1];
			const world = div.firstChild!;
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(12)).toEqual([area, 2]);
			expect(area.indexAt(area, 0)).toBe(0);
			expect(area.indexAt(area, 1)).toBe(5);
			expect(area.indexAt(area, 2)).toBe(12);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
			expect(area.value).toEqual("hello\nworld\n");
			const div1 = area.firstChild!;
			const hello = div1.childNodes[0];
			const div2 = div1.childNodes[1];
			const world = div2.firstChild!;
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(12)).toEqual([area, 1]);
			expect(area.indexAt(div1, 0)).toBe(0);
			// This is mildly surprising, but it reflects the behavior of the
			// selection.collapse().
			expect(area.indexAt(div1, 1)).toBe(5);
			expect(area.indexAt(div1, 2)).toBe(12);
			expect(area.indexAt(div2, 0)).toBe(6);
			expect(area.indexAt(div2, 1)).toBe(11);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
			expect(area.value).toEqual("hello\nworld\nthird\n");
			const div1 = area.firstChild!;
			const hello = div1.childNodes[0];
			const div2 = div1.childNodes[1];
			const world = div2.childNodes[0];
			const div3 = div2.childNodes[1];
			const third = div3.firstChild!;
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(12)).toEqual([third, 0]);
			expect(area.nodeOffsetAt(13)).toEqual([third, 1]);
			expect(area.nodeOffsetAt(14)).toEqual([third, 2]);
			expect(area.nodeOffsetAt(15)).toEqual([third, 3]);
			expect(area.nodeOffsetAt(16)).toEqual([third, 4]);
			expect(area.nodeOffsetAt(17)).toEqual([third, 5]);
			expect(area.nodeOffsetAt(18)).toEqual([area, 1]);
			expect(area.indexAt(area, 0)).toBe(0);
			expect(area.indexAt(area, 1)).toBe(18);
			expect(area.indexAt(div1, 0)).toBe(0);
			expect(area.indexAt(div1, 1)).toBe(5);
			expect(area.indexAt(div1, 2)).toBe(18);
			expect(area.indexAt(div2, 0)).toBe(6);
			expect(area.indexAt(div2, 1)).toBe(11);
			expect(area.indexAt(div2, 2)).toBe(18);
			expect(area.indexAt(div3, 0)).toBe(12);
			expect(area.indexAt(div3, 1)).toBe(17);
			expect(area.indexAt(hello, 0)).toBe(0);
			expect(area.indexAt(hello, 1)).toBe(1);
			expect(area.indexAt(hello, 2)).toBe(2);
			expect(area.indexAt(hello, 3)).toBe(3);
			expect(area.indexAt(hello, 4)).toBe(4);
			expect(area.indexAt(hello, 5)).toBe(5);
			expect(area.indexAt(world, 0)).toBe(6);
			expect(area.indexAt(world, 1)).toBe(7);
			expect(area.indexAt(world, 2)).toBe(8);
			expect(area.indexAt(world, 3)).toBe(9);
			expect(area.indexAt(world, 4)).toBe(10);
			expect(area.indexAt(world, 5)).toBe(11);
			expect(area.indexAt(third, 0)).toBe(12);
			expect(area.indexAt(third, 1)).toBe(13);
			expect(area.indexAt(third, 2)).toBe(14);
			expect(area.indexAt(third, 3)).toBe(15);
			expect(area.indexAt(third, 4)).toBe(16);
			expect(area.indexAt(third, 5)).toBe(17);
			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
			expect(area.value).toEqual("hello\n\nworld\n");
			const div = area.firstChild!;
			const hello = div.childNodes[0];
			const br1 = div.childNodes[1];
			const br2 = div.childNodes[2];
			const world = div.childNodes[3];
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([div, 2]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(12)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(13)).toEqual([area, 1]);
			expect(area.indexAt(div, 0)).toBe(0);
			expect(area.indexAt(div, 1)).toBe(5);
			expect(area.indexAt(div, 2)).toBe(6);
			expect(area.indexAt(div, 3)).toBe(7);
			expect(area.indexAt(div, 4)).toBe(12);
			expect(area.indexAt(br1, 0)).toBe(5);
			expect(area.indexAt(br1, 1)).toBe(6);
			expect(area.indexAt(br2, 0)).toBe(6);
			expect(area.indexAt(br2, 1)).toBe(7);
			expect(area.indexAt(hello, 0)).toBe(0);
			expect(area.indexAt(hello, 1)).toBe(1);
			expect(area.indexAt(hello, 2)).toBe(2);
			expect(area.indexAt(hello, 3)).toBe(3);
			expect(area.indexAt(hello, 4)).toBe(4);
			expect(area.indexAt(hello, 5)).toBe(5);
			expect(area.indexAt(world, 0)).toBe(7);
			expect(area.indexAt(world, 1)).toBe(8);
			expect(area.indexAt(world, 2)).toBe(9);
			expect(area.indexAt(world, 3)).toBe(10);
			expect(area.indexAt(world, 4)).toBe(11);
			expect(area.indexAt(world, 5)).toBe(12);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
			expect(area.value).toEqual("hello\nworld\n");
			const root = area.firstChild!;
			const div1 = root.childNodes[0];
			const hello = div1.childNodes[0];
			const br1 = div1.childNodes[1];
			const div2 = root.childNodes[1];
			const world = div2.childNodes[0];
			const br2 = div2.childNodes[1];
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(12)).toEqual([area, 1]);
			expect(area.indexAt(area, 0)).toBe(0);
			expect(area.indexAt(area, 1)).toBe(12);
			expect(area.indexAt(root, 0)).toBe(0);
			expect(area.indexAt(root, 1)).toBe(6);
			expect(area.indexAt(root, 2)).toBe(12);
			expect(area.indexAt(hello, 0)).toBe(0);
			expect(area.indexAt(hello, 1)).toBe(1);
			expect(area.indexAt(hello, 2)).toBe(2);
			expect(area.indexAt(hello, 3)).toBe(3);
			expect(area.indexAt(hello, 4)).toBe(4);
			expect(area.indexAt(hello, 5)).toBe(5);
			expect(area.indexAt(br1, 0)).toBe(5);
			expect(area.indexAt(br1, 1)).toBe(6);
			expect(area.indexAt(world, 0)).toBe(6);
			expect(area.indexAt(world, 1)).toBe(7);
			expect(area.indexAt(world, 2)).toBe(8);
			expect(area.indexAt(world, 3)).toBe(9);
			expect(area.indexAt(world, 4)).toBe(10);
			expect(area.indexAt(world, 5)).toBe(11);
			expect(area.indexAt(br2, 0)).toBe(11);
			expect(area.indexAt(br2, 1)).toBe(12);
			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
			expect(area.value).toEqual("hello\nworld\n");
			const div = area.firstChild!;
			const hello = div.childNodes[0];
			const br1 = div.childNodes[1];
			const world = div.childNodes[2];
			const br2 = div.childNodes[3];
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(13)).toEqual([area, 1]);
			expect(area.indexAt(div, 0)).toBe(0);
			expect(area.indexAt(div, 1)).toBe(5);
			expect(area.indexAt(div, 2)).toBe(6);
			expect(area.indexAt(div, 3)).toBe(11);
			expect(area.indexAt(div, 4)).toBe(12);
			expect(area.indexAt(br1, 0)).toBe(5);
			expect(area.indexAt(br1, 1)).toBe(6);
			expect(area.indexAt(br2, 0)).toBe(11);
			expect(area.indexAt(br2, 1)).toBe(12);
			expect(area.indexAt(hello, 0)).toBe(0);
			expect(area.indexAt(hello, 1)).toBe(1);
			expect(area.indexAt(hello, 2)).toBe(2);
			expect(area.indexAt(hello, 3)).toBe(3);
			expect(area.indexAt(hello, 4)).toBe(4);
			expect(area.indexAt(hello, 5)).toBe(5);
			expect(area.indexAt(world, 0)).toBe(6);
			expect(area.indexAt(world, 1)).toBe(7);
			expect(area.indexAt(world, 2)).toBe(8);
			expect(area.indexAt(world, 3)).toBe(9);
			expect(area.indexAt(world, 4)).toBe(10);
			expect(area.indexAt(world, 5)).toBe(11);
			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(area.value.length, i)),
				);
			}
		});

		test("multiple spans", () => {
			area.innerHTML =
				"<span>h</span>ell<span>o</span> <span>w</span>orl<span>d</span>";
			expect(area.value).toBe("hello world");
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
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([h, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([ell, 0]);
			expect(area.nodeOffsetAt(2)).toEqual([ell, 1]);
			expect(area.nodeOffsetAt(3)).toEqual([ell, 2]);
			expect(area.nodeOffsetAt(4)).toEqual([ell, 3]);
			expect(area.nodeOffsetAt(5)).toEqual([space, 0]);
			expect(area.nodeOffsetAt(6)).toEqual([space, 1]);
			expect(area.nodeOffsetAt(7)).toEqual([orl, 0]);
			expect(area.nodeOffsetAt(8)).toEqual([orl, 1]);
			expect(area.nodeOffsetAt(9)).toEqual([orl, 2]);
			expect(area.nodeOffsetAt(10)).toEqual([orl, 3]);
			expect(area.nodeOffsetAt(11)).toEqual([area, 7]);

			expect(area.indexAt(span1, 0)).toBe(0);
			expect(area.indexAt(span1, 1)).toBe(1);
			expect(area.indexAt(h, 0)).toBe(0);
			expect(area.indexAt(h, 1)).toBe(1);
			expect(area.indexAt(ell, 0)).toBe(1);
			expect(area.indexAt(ell, 1)).toBe(2);
			expect(area.indexAt(ell, 2)).toBe(3);
			expect(area.indexAt(ell, 3)).toBe(4);
			expect(area.indexAt(span2, 0)).toBe(4);
			expect(area.indexAt(span2, 1)).toBe(5);
			expect(area.indexAt(o, 0)).toBe(4);
			expect(area.indexAt(o, 1)).toBe(5);
			expect(area.indexAt(span3, 0)).toBe(6);
			expect(area.indexAt(span3, 1)).toBe(7);
			expect(area.indexAt(w, 0)).toBe(6);
			expect(area.indexAt(w, 1)).toBe(7);
			expect(area.indexAt(orl, 0)).toBe(7);
			expect(area.indexAt(orl, 1)).toBe(8);
			expect(area.indexAt(orl, 2)).toBe(9);
			expect(area.indexAt(orl, 3)).toBe(10);
			expect(area.indexAt(span4, 0)).toBe(10);
			expect(area.indexAt(span4, 1)).toBe(11);
			expect(area.indexAt(d, 0)).toBe(10);
			expect(area.indexAt(d, 1)).toBe(11);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(area.value.length, i)),
				);
			}
		});

		test("data content", () => {
			//<div>Hello <img> World <img></div>
			area.innerHTML =
				'<div>hello <img data-content="👋"> world <img data-content="🌎"></div>';

			expect(area.value).toEqual("hello 👋 world 🌎\n");
			const div = area.firstChild!;
			const hello = div.childNodes[0];
			const wave = div.childNodes[1];
			const world = div.childNodes[2];
			const globe = div.childNodes[3];
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([hello, 6]);
			// TODO: It would be nice to have the node be a text node here.
			expect(area.nodeOffsetAt(7)).toEqual([div, 2]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 0]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(12)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(13)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(14)).toEqual([world, 6]);
			expect(area.nodeOffsetAt(15)).toEqual([world, 7]);
			expect(area.nodeOffsetAt(16)).toEqual([div, 4]);
			expect(area.nodeOffsetAt(17)).toEqual([div, 4]);
			expect(area.nodeOffsetAt(18)).toEqual([area, 1]);

			expect(area.indexAt(div, 0)).toBe(0);
			expect(area.indexAt(div, 1)).toBe(6);
			expect(area.indexAt(div, 2)).toBe(8);
			expect(area.indexAt(div, 3)).toBe(15);
			expect(area.indexAt(div, 4)).toBe(17);
			expect(area.indexAt(hello, 0)).toBe(0);
			expect(area.indexAt(hello, 1)).toBe(1);
			expect(area.indexAt(hello, 2)).toBe(2);
			expect(area.indexAt(hello, 3)).toBe(3);
			expect(area.indexAt(hello, 4)).toBe(4);
			expect(area.indexAt(hello, 5)).toBe(5);
			expect(area.indexAt(hello, 6)).toBe(6);
			expect(area.indexAt(wave, 0)).toBe(6);
			expect(area.indexAt(wave, 1)).toBe(8);
			expect(area.indexAt(world, 0)).toBe(8);
			expect(area.indexAt(world, 1)).toBe(9);
			expect(area.indexAt(world, 2)).toBe(10);
			expect(area.indexAt(world, 3)).toBe(11);
			expect(area.indexAt(world, 4)).toBe(12);
			expect(area.indexAt(world, 5)).toBe(13);
			expect(area.indexAt(world, 6)).toBe(14);
			expect(area.indexAt(world, 7)).toBe(15);
			expect(area.indexAt(globe, 0)).toBe(15);
			expect(area.indexAt(globe, 1)).toBe(17);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
				'<div><div>Hello <img data-content="🌎"></div><div><br></div><div><br></div></div>';
			expect(area.value).toEqual("Hello 🌎\n\n\n");
			const root = area.firstChild!;
			const div1 = root.childNodes[0];
			const hello = div1.childNodes[0];
			const img = div1.childNodes[1];
			const div2 = root.childNodes[1];
			const div3 = root.childNodes[2];
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([hello, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([hello, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([hello, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([hello, 3]);
			expect(area.nodeOffsetAt(4)).toEqual([hello, 4]);
			expect(area.nodeOffsetAt(5)).toEqual([hello, 5]);
			expect(area.nodeOffsetAt(6)).toEqual([hello, 6]);
			expect(area.nodeOffsetAt(7)).toEqual([div1, 2]);
			expect(area.nodeOffsetAt(8)).toEqual([div1, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([div2, 0]);
			expect(area.nodeOffsetAt(10)).toEqual([div2, 0]);
			expect(area.nodeOffsetAt(11)).toEqual([area, 1]);

			expect(area.indexAt(div1, 0)).toBe(0);
			expect(area.indexAt(div1, 1)).toBe(6);
			expect(area.indexAt(div1, 2)).toBe(8);
			expect(area.indexAt(hello, 0)).toBe(0);
			expect(area.indexAt(hello, 1)).toBe(1);
			expect(area.indexAt(hello, 2)).toBe(2);
			expect(area.indexAt(hello, 3)).toBe(3);
			expect(area.indexAt(hello, 4)).toBe(4);
			expect(area.indexAt(hello, 5)).toBe(5);
			expect(area.indexAt(img, 0)).toBe(6);
			expect(area.indexAt(img, 1)).toBe(8);
			expect(area.indexAt(div2, 0)).toBe(9);
			expect(area.indexAt(div2, 1)).toBe(10);
			expect(area.indexAt(div3, 0)).toBe(10);
			expect(area.indexAt(div3, 1)).toBe(11);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
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
			expect(area.value).toBe("aabbcc\n");
			const div = area.childNodes[0];
			const aa = div.childNodes[0];
			const span1 = div.childNodes[1];
			const cc = div.childNodes[2];
			const span2 = span1.firstChild;

			expect(area.nodeOffsetAt(0)).toEqual([aa, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([aa, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([aa, 2]);
			expect(area.nodeOffsetAt(3)).toEqual([div, 2]);
			expect(area.nodeOffsetAt(4)).toEqual([cc, 0]);
			expect(area.nodeOffsetAt(5)).toEqual([cc, 1]);
			expect(area.nodeOffsetAt(6)).toEqual([cc, 2]);
			expect(area.nodeOffsetAt(7)).toEqual([area, 1]);

			expect(area.indexAt(span1, 0)).toBe(2);
			expect(area.indexAt(span1, 1)).toBe(4);
			expect(area.indexAt(span2, 0)).toBe(2);
			expect(area.indexAt(span2, 1)).toBe(2);
			expect(area.indexAt(span2, 3)).toBe(2);
			expect(area.indexAt(span2, 4)).toBe(2);
			expect(area.indexAt(span2, 5)).toBe(2);
			expect(area.indexAt(span2, 6)).toBe(2);
			expect(area.indexAt(span2, 7)).toBe(2);
			expect(area.indexAt(span2, 8)).toBe(2);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(area.value.length, i === 3 ? 4 : i)),
				);
			}
		});
	});
});
