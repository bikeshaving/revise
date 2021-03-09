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

	describe("nodeOffsetAt/indexOf", () => {
		test("adjacent divs", () => {
			area.innerHTML = "<div><div>hello</div><div>world</div></div>";
			expect(area.value).toEqual("hello\nworld\n");
			expect(area.nodeOffsetAt(-2)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([
				area.firstChild!.childNodes[0].firstChild,
				0,
			]);
			expect(area.nodeOffsetAt(1)).toEqual([
				area.firstChild!.childNodes[0].firstChild,
				1,
			]);
			expect(area.nodeOffsetAt(2)).toEqual([
				area.firstChild!.childNodes[0].firstChild,
				2,
			]);
			expect(area.nodeOffsetAt(3)).toEqual([
				area.firstChild!.childNodes[0].firstChild,
				3,
			]);
			expect(area.nodeOffsetAt(4)).toEqual([
				area.firstChild!.childNodes[0].firstChild,
				4,
			]);
			expect(area.nodeOffsetAt(5)).toEqual([
				area.firstChild!.childNodes[0].firstChild,
				5,
			]);
			expect(area.nodeOffsetAt(6)).toEqual([area.firstChild!.childNodes[1], 0]);
			expect(area.nodeOffsetAt(7)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				1,
			]);
			expect(area.nodeOffsetAt(8)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				2,
			]);
			expect(area.nodeOffsetAt(9)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				3,
			]);
			expect(area.nodeOffsetAt(10)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				4,
			]);
			expect(area.nodeOffsetAt(11)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				5,
			]);
			expect(area.nodeOffsetAt(12)).toEqual([area.firstChild, 2]);
			expect(area.nodeOffsetAt(13)).toEqual([area.firstChild, 2]);

			for (let i = -3; i < area.value.length + 3; i++) {
				expect(area.indexOf(...area.nodeOffsetAt(i))).toEqual(
					Math.max(-1, Math.min(i, area.value.length)),
				);
			}
		});

		test("div after text", () => {
			area.innerHTML = "<div>hello<div>world</div></div>";
			expect(area.value).toEqual("hello\nworld\n");
			expect(area.nodeOffsetAt(-2)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([area.firstChild!.childNodes[0], 0]);
			expect(area.nodeOffsetAt(1)).toEqual([area.firstChild!.childNodes[0], 1]);
			expect(area.nodeOffsetAt(2)).toEqual([area.firstChild!.childNodes[0], 2]);
			expect(area.nodeOffsetAt(3)).toEqual([area.firstChild!.childNodes[0], 3]);
			expect(area.nodeOffsetAt(4)).toEqual([area.firstChild!.childNodes[0], 4]);
			expect(area.nodeOffsetAt(5)).toEqual([area.firstChild!.childNodes[0], 5]);
			expect(area.nodeOffsetAt(6)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				0,
			]);
			expect(area.nodeOffsetAt(7)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				1,
			]);
			expect(area.nodeOffsetAt(8)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				2,
			]);
			expect(area.nodeOffsetAt(9)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				3,
			]);
			expect(area.nodeOffsetAt(10)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				4,
			]);
			expect(area.nodeOffsetAt(11)).toEqual([
				area.firstChild!.childNodes[1].firstChild,
				5,
			]);
			expect(area.nodeOffsetAt(12)).toEqual([area.firstChild, 2]);
			expect(area.nodeOffsetAt(13)).toEqual([area.firstChild, 2]);
			expect(area.nodeOffsetAt(14)).toEqual([area.firstChild, 2]);

			for (let i = -3; i < area.value.length + 3; i++) {
				expect(area.indexOf(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i, area.value.length)),
				);
			}
		});

		test("double br", () => {
			area.innerHTML = "<div>hello<br><br>world</div>";
			expect(area.value).toEqual("hello\n\nworld\n");
			expect(area.nodeOffsetAt(-2)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([area.firstChild!.childNodes[0], 0]);
			expect(area.nodeOffsetAt(1)).toEqual([area.firstChild!.childNodes[0], 1]);
			expect(area.nodeOffsetAt(2)).toEqual([area.firstChild!.childNodes[0], 2]);
			expect(area.nodeOffsetAt(3)).toEqual([area.firstChild!.childNodes[0], 3]);
			expect(area.nodeOffsetAt(4)).toEqual([area.firstChild!.childNodes[0], 4]);
			expect(area.nodeOffsetAt(5)).toEqual([area.firstChild!.childNodes[0], 5]);
			expect(area.nodeOffsetAt(6)).toEqual([area.firstChild!, 2]);
			expect(area.nodeOffsetAt(7)).toEqual([area.firstChild!.childNodes[3], 0]);
			expect(area.nodeOffsetAt(8)).toEqual([area.firstChild!.childNodes[3], 1]);
			expect(area.nodeOffsetAt(9)).toEqual([area.firstChild!.childNodes[3], 2]);
			expect(area.nodeOffsetAt(10)).toEqual([
				area.firstChild!.childNodes[3],
				3,
			]);
			expect(area.nodeOffsetAt(11)).toEqual([
				area.firstChild!.childNodes[3],
				4,
			]);
			expect(area.nodeOffsetAt(12)).toEqual([
				area.firstChild!.childNodes[3],
				5,
			]);
			expect(area.nodeOffsetAt(13)).toEqual([area.firstChild, 4]);
			expect(area.nodeOffsetAt(14)).toEqual([area.firstChild, 4]);
			expect(area.nodeOffsetAt(15)).toEqual([area.firstChild, 4]);
			for (let i = -3; i < area.value.length + 3; i++) {
				expect(area.indexOf(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i, area.value.length)),
				);
			}
		});

		test("text and br alternating", () => {
			area.innerHTML = "<div>hello<br>world<br></div>";
			expect(area.value).toEqual("hello\nworld\n");
			expect(area.nodeOffsetAt(-2)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([area.firstChild!.childNodes[0], 0]);
			expect(area.nodeOffsetAt(1)).toEqual([area.firstChild!.childNodes[0], 1]);
			expect(area.nodeOffsetAt(2)).toEqual([area.firstChild!.childNodes[0], 2]);
			expect(area.nodeOffsetAt(3)).toEqual([area.firstChild!.childNodes[0], 3]);
			expect(area.nodeOffsetAt(4)).toEqual([area.firstChild!.childNodes[0], 4]);
			expect(area.nodeOffsetAt(5)).toEqual([area.firstChild!.childNodes[0], 5]);
			expect(area.nodeOffsetAt(6)).toEqual([area.firstChild!.childNodes[2], 0]);
			expect(area.nodeOffsetAt(7)).toEqual([area.firstChild!.childNodes[2], 1]);
			expect(area.nodeOffsetAt(8)).toEqual([area.firstChild!.childNodes[2], 2]);
			expect(area.nodeOffsetAt(9)).toEqual([area.firstChild!.childNodes[2], 3]);
			expect(area.nodeOffsetAt(10)).toEqual([
				area.firstChild!.childNodes[2],
				4,
			]);
			expect(area.nodeOffsetAt(11)).toEqual([
				area.firstChild!.childNodes[2],
				5,
			]);
			expect(area.nodeOffsetAt(12)).toEqual([area.firstChild, 4]);
			expect(area.nodeOffsetAt(13)).toEqual([area.firstChild, 4]);
			expect(area.nodeOffsetAt(14)).toEqual([area.firstChild, 4]);
			expect(area.nodeOffsetAt(15)).toEqual([area.firstChild, 4]);
			for (let i = -3; i < area.value.length + 3; i++) {
				expect(area.indexOf(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i, area.value.length)),
				);
			}
		});

		test("single br", () => {
			area.innerHTML = "<div><br></div>";
			expect(area.value).toEqual("\n");
			expect(area.nodeOffsetAt(-2)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([area.firstChild, 0]);
			expect(area.nodeOffsetAt(1)).toEqual([area.firstChild, 1]);
			for (let i = -3; i < area.value.length + 3; i++) {
				expect(area.indexOf(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i, area.value.length)),
				);
			}

			// TODO: fix this edge case
			expect(area.indexOf(area.firstChild!.firstChild, 0)).toEqual(0);
		});

		test("data-content", () => {
			area.innerHTML =
				'<div><div>Hello <img src="" data-content="😓"/></div></div>';
			expect(area.value).toEqual("Hello 😓\n");
			expect(area.nodeOffsetAt(-2)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(-1)).toEqual([null, 0]);
			expect(area.nodeOffsetAt(0)).toEqual([
				area.firstChild!.firstChild!.childNodes[0],
				0,
			]);
			expect(area.nodeOffsetAt(1)).toEqual([
				area.firstChild!.firstChild!.childNodes[0],
				1,
			]);
			expect(area.nodeOffsetAt(2)).toEqual([
				area.firstChild!.firstChild!.childNodes[0],
				2,
			]);
			expect(area.nodeOffsetAt(3)).toEqual([
				area.firstChild!.firstChild!.childNodes[0],
				3,
			]);
			expect(area.nodeOffsetAt(4)).toEqual([
				area.firstChild!.firstChild!.childNodes[0],
				4,
			]);
			expect(area.nodeOffsetAt(5)).toEqual([
				area.firstChild!.firstChild!.childNodes[0],
				5,
			]);
			expect(area.nodeOffsetAt(6)).toEqual([
				area.firstChild!.firstChild!.childNodes[0],
				6,
			]);
			expect(area.nodeOffsetAt(7)).toEqual([
				area.firstChild!.firstChild!.childNodes[1],
				1,
			]);
			for (let i = -3; i < area.value.length + 3; i++) {
				// any index which is “inside the img” will be set to the end
				expect(area.indexOf(...area.nodeOffsetAt(i))).toBe(
					Math.max(-1, Math.min(i === 7 ? 8 : i, area.value.length)),
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
				area.firstChild!.firstChild!.data = "Hello\nWorld";
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
					area.firstChild!.firstChild!.data = "Hello\n\nWorld";
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
