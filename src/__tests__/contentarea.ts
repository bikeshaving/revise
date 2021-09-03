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
	});

	describe("nodeOffsetAt/indexAt", () => {
		test("single line", () => {
			area.innerHTML = "<div><br></div>";
			expect(area.value).toEqual("\n");
			const div = area.firstChild!;
			const br = div.firstChild!;
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([div, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([div, 1]);
			expect(area.indexAt(div, 0)).toBe(0);
			expect(area.indexAt(div, 1)).toBe(1);
			expect(area.indexAt(br, 0)).toBe(0);
			expect(area.indexAt(br, 1)).toBe(1);
		});

		test("adjacent divs", () => {
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
			expect(area.nodeOffsetAt(6)).toEqual([div2, 0]);
			expect(area.nodeOffsetAt(7)).toEqual([world, 1]);
			expect(area.nodeOffsetAt(8)).toEqual([world, 2]);
			expect(area.nodeOffsetAt(9)).toEqual([world, 3]);
			expect(area.nodeOffsetAt(10)).toEqual([world, 4]);
			expect(area.nodeOffsetAt(11)).toEqual([world, 5]);
			expect(area.nodeOffsetAt(12)).toEqual([root, 2]);
			expect(area.indexAt(root, 0)).toBe(0);
			expect(area.indexAt(root, 1)).toBe(6);
			expect(area.indexAt(root, 2)).toBe(12);
			expect(area.indexAt(div1, 0)).toBe(0);
			expect(area.indexAt(div1, 1)).toBe(5);
			expect(area.indexAt(div2, 0)).toBe(6);
			expect(area.indexAt(div2, 1)).toBe(11);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i, area.value.length)),
				);
			}
		});

		test("div after text", () => {
			// <div>
			//   hello
			//   <div>world</div>
			// </div>
			area.innerHTML = "<div>hello<div>world</div></div>";
			const root = area.firstChild!;
			const hello = root.childNodes[0];
			const div = root.childNodes[1];
			const world = div.firstChild!;
			expect(area.value).toEqual("hello\nworld\n");
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
			expect(area.nodeOffsetAt(12)).toEqual([root, 2]);
			expect(area.indexAt(root, 0)).toBe(0);
			// mildly surprising, but reflects the behavior of the selection.collapse()
			expect(area.indexAt(root, 1)).toBe(5);
			expect(area.indexAt(root, 2)).toBe(12);
			expect(area.indexAt(div, 0)).toBe(6);
			expect(area.indexAt(div, 1)).toBe(11);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i, area.value.length)),
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
			expect(area.nodeOffsetAt(13)).toEqual([div, 4]);
			expect(area.indexAt(div, 0)).toBe(0);
			expect(area.indexAt(div, 1)).toBe(5);
			expect(area.indexAt(div, 2)).toBe(6);
			expect(area.indexAt(div, 3)).toBe(7);
			expect(area.indexAt(div, 4)).toBe(12);
			expect(area.indexAt(br1, 0)).toBe(5);
			expect(area.indexAt(br1, 1)).toBe(6);
			expect(area.indexAt(br2, 0)).toBe(6);
			expect(area.indexAt(br2, 1)).toBe(7);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i, area.value.length - 1)),
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
			expect(area.nodeOffsetAt(13)).toEqual([div, 4]);
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

		test("data-content", () => {
			//<div>
			//  <div>Hello <img></div>
			//  <div><br></div>
			//  <div><br></div>
			//</div>
			area.innerHTML =
				'<div><div>Hello <img src="" data-content="🌎"></div><div><br></div><div><br></div></div>';
			expect(area.value).toEqual("Hello 🌎\n\n\n");
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			const root = area.firstChild!;
			const div1 = root.childNodes[0];
			const hello = div1.childNodes[0];
			const img = div1.childNodes[1];
			const div2 = root.childNodes[1];
			const div3 = root.childNodes[2];
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
			expect(area.nodeOffsetAt(11)).toEqual([root, 3]);

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

			for (let i = -1; i < area.value.length + 3; i++) {
				// When i === 7, we are indexing the second byte of the 🌎, according
				// to utf-16 code units, so the nodeOffset returned is the parent div
				// of the img, with an offset equal to the number of child nodes for
				// this parent div.
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(area.value.length, i === 7 ? 8 : i)),
				);
			}
		});

		test("data-content with different children", () => {
			// <div>
			//   <span><span>Double a</span></span>
			// </div>
			// <div><br></div>
			area.innerHTML =
				'<div><span data-content="aa"><span>double a</span></span></div><div><br></div>';
			expect(area.value).toBe("aa\n\n");
			const div1 = area.childNodes[0];
			const dataContentSpan = div1.firstChild!;
			const altContentSpan = dataContentSpan.firstChild!;
			const text = altContentSpan.firstChild;
			const div2 = area.childNodes[1];
			expect(area.nodeOffsetAt(0)).toEqual([dataContentSpan, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([dataContentSpan, 1]);
			expect(area.nodeOffsetAt(2)).toEqual([dataContentSpan, 1]);
			expect(area.nodeOffsetAt(3)).toEqual([div2, 0]);
			expect(area.nodeOffsetAt(4)).toEqual([div2, 1]);
			expect(area.nodeOffsetAt(4)).toEqual([div2, 1]);
			expect(area.indexAt(text, 0)).toBe(0);
			expect(area.indexAt(text, 1)).toBe(2);
			expect(area.indexAt(text, 2)).toBe(2);

			for (let i = -1; i < area.value.length + 1; i++) {
				expect(area.indexAt(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(area.value.length, i === 1 ? 2 : i)),
				);
			}
		});
	});

	describe("repair", () => {
		test("replacing line insertion with whitespace", () => {
			area.innerHTML = "<div>Hello</div>";
			expect(area.value).toEqual("Hello\n");
			area.insertAdjacentHTML("beforeend", "<div>World</div>");
			expect(area.value).toEqual("Hello\nWorld\n");
			area.repair(() => {
				area.lastChild!.remove();
				(area.firstChild!.firstChild as Text).data = "Hello\nWorld";
			});
			expect(area.value).toEqual("Hello\nWorld\n");
			expect(area.innerHTML).toEqual("<div>Hello\nWorld</div>");
		});

		test("invalid", () => {
			area.innerHTML = "<div>Hello</div>";
			expect(area.value).toEqual("Hello\n");
			area.insertAdjacentHTML("beforeend", "<div>World</div>");
			expect(area.value).toEqual("Hello\nWorld\n");
			expect(() => {
				area.repair(() => {
					area.lastChild!.remove();
					area.firstChild!.textContent = "Hello\n\nWorld";
				});
			}).toThrow("Expected");
			expect(area.value).toEqual("Hello\n\nWorld\n");
			expect(area.innerHTML).toEqual("<div>Hello\n\nWorld</div>");
		});

		test("tab insertion assertion", () => {
			area.innerHTML = "<div>Hello</div>";
			expect(area.value).toEqual("Hello\n");
			area.insertAdjacentHTML("beforeend", "<div>World</div>");
			expect(area.value).toEqual("Hello\nWorld\n");
			area.repair(() => {
				(area.lastChild as Element).insertAdjacentText("afterbegin", "\t");
			}, "Hello\n\tWorld\n");
			expect(area.value).toEqual("Hello\n\tWorld\n");
			expect(area.innerHTML).toEqual("<div>Hello</div><div>\tWorld</div>");
		});
	});
});
