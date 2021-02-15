/// <reference lib="dom" />
import {Patch} from "./patch";

// TODO: Use a map instead of symbol properties?
/**
 * A symbol property added to DOM nodes whose value is the content offset of a
 * child node relative to its parent.
 */
export const ContentOffset = Symbol.for("revise.ContentOffset");

/**
 * A symbol property added to DOM nodes whose value is the content length of
 * its children.
 */
export const ContentLength = Symbol.for("revise.ContentLength");

declare global {
	interface Node {
		[ContentOffset]?: number | undefined;
		[ContentLength]?: number | undefined;
	}
}

// TODO: CUSTOM NEWLINES????????????
const NEWLINE = "\n";

const BLOCKLIKE_ELEMENTS = new Set([
	"ADDRESS",
	"ARTICLE",
	"ASIDE",
	"BLOCKQUOTE",
	"CAPTION",
	"DETAILS",
	"DIALOG",
	"DD",
	"DIV",
	"DL",
	"DT",
	"FIELDSET",
	"FIGCAPTION",
	"FIGURE",
	"FOOTER",
	"FORM",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
	"HEADER",
	"HGROUP",
	"HR",
	"LI",
	"MAIN",
	"NAV",
	"OL",
	"P",
	"PRE",
	"SECTION",
	"TABLE",
	"TR",
	"UL",
]);

function isBlocklikeElement(node: Node): node is Element {
	return (
		node.nodeType === Node.ELEMENT_NODE && BLOCKLIKE_ELEMENTS.has(node.nodeName)
	);
}

// TODO: Stop exporting this function
// TODO: It might be faster to construct a patch rather than concatenating a string.
export function getContent(root: Node, contentOldValue?: string): string {
	if (contentOldValue && typeof root[ContentLength] !== "undefined") {
		if (contentOldValue.length !== root[ContentLength]) {
			throw new Error("contentOldValue does not match root length");
		}

		return contentOldValue;
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	let content = "";
	let hasNewline = false;
	let oldIndex = 0;
	let oldIndexRelative = 0;
	let offset = 0;
	// TODO: Both these arrays work like stacks. Maybe we can have a single one.
	// TODO: the stack is mostly unnecessary for the root, maybe we can start with the firstChild
	const indexes: Array<number> = [];
	const offsets: Array<number> = [];
	const seen = new Set<Node>();
	for (let node: Node | null = root; node !== null; ) {
		if (!seen.has(node)) {
			while (!contentOldValue || typeof node[ContentLength] === "undefined") {
				node[ContentOffset] = offset;
				const newlineBefore = !hasNewline && offset && isBlocklikeElement(node);
				if (newlineBefore) {
					content += NEWLINE;
					hasNewline = true;
				}

				const firstChild = walker.firstChild();
				if (firstChild) {
					offsets.push(offset);
					indexes.push(oldIndexRelative);
					oldIndexRelative = oldIndex;
					if (newlineBefore) {
						offset = NEWLINE.length;
					} else {
						offset = 0;
					}

					seen.add(node);
					node = firstChild;
				} else {
					break;
				}
			}
		}

		if (contentOldValue && typeof node[ContentLength] !== "undefined") {
			const oldOffset = oldIndex - oldIndexRelative;
			if (oldOffset < node[ContentOffset]!) {
				// A deletion has been detected.
				oldIndex += node[ContentOffset]! - oldOffset;
			}

			// Set the offset to the new offset
			node[ContentOffset] = offset;
			const length = node[ContentLength]!;
			const content1 = contentOldValue.slice(oldIndex, oldIndex + length);
			if (content1.length !== length) {
				throw new Error("String length mismatch");
			}

			content += content1;
			offset += length;
			oldIndex += length;
			hasNewline = content1.endsWith(NEWLINE);
		} else {
			if (node.nodeType === Node.TEXT_NODE) {
				const content1 = (node as Text).data;
				content += content1;
				offset += content1.length;
				hasNewline = content1.endsWith(NEWLINE);
			} else if (node.nodeName === "BR") {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			} else if (
				!hasNewline &&
				isBlocklikeElement(node) &&
				node.firstChild !== null
			) {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}

			const length = offset - (node[ContentOffset] || 0);
			node[ContentLength] = length;
		}

		node = walker.nextSibling();
		if (node === null && walker.currentNode !== root) {
			const offset1 = offsets.pop();
			const oldIndexRelative1 = indexes.pop();
			if (offset1 === undefined || oldIndexRelative1 === undefined) {
				throw new Error("Missing offset");
			}

			offset = offset1 + offset;
			oldIndexRelative = oldIndexRelative1;
			node = walker.parentNode();
		}
	}

	return content;
}

function clean(root: Node): void {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	for (let node: Node | null = root; node !== null; node = walker.nextNode()) {
		node[ContentOffset] = undefined;
		node[ContentLength] = undefined;
	}
}

// TODO: Stop exporting this function
/**
 * Given an observed root, and an array of mutation records, this function
 * invalidates nodes which have changed by deleting the ContentOffset and
 * ContentLength properties from them.
 *
 * @returns a boolean indicating whether or not the DOM node has been invalidated
 */
export function invalidate(root: Node, records: Array<MutationRecord>): void {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		for (let j = 0; j < record.addedNodes.length; j++) {
			clean(record.addedNodes[j]);
		}

		for (let j = 0; j < record.removedNodes.length; j++) {
			clean(record.removedNodes[j]);
		}

		let node = record.target;
		// TODO: handle non-contenteditable widgets
		if (node === root) {
			invalidated = true;
			continue;
		} else if (
			typeof node[ContentLength] === "undefined" ||
			!root.contains(node)
		) {
			continue;
		}

		for (; node !== root; node = node.parentNode!) {
			if (typeof node[ContentLength] === "undefined") {
				break;
			}

			node[ContentLength] = undefined;
			node[ContentOffset] = undefined;
			invalidated = true;
		}
	}

	if (invalidated) {
		root[ContentLength] = undefined;
		root[ContentOffset] = undefined;
	}
}

// TODO: Stop exporting this function
export function indexFromNodeOffset(
	root: Node,
	node: Node | null,
	offset: number,
): number {
	if (
		node == null ||
		!root.contains(node) ||
		typeof node[ContentLength] === "undefined"
	) {
		return -1;
	}

	let index = offset;
	if (node.nodeType === Node.ELEMENT_NODE) {
		if (offset >= node.childNodes.length) {
			if (index > 0) {
				index = node[ContentLength] || 0;
			}
		} else {
			node = node.childNodes[offset];
			index = 0;
		}
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	walker.currentNode = node;
	while (node !== null && node !== root) {
		const previousSibling = walker.previousSibling();
		if (previousSibling === null) {
			const parentNode = walker.parentNode();
			if (parentNode) {
				index += node[ContentOffset] || 0;
			}

			node = parentNode;
		} else {
			node = previousSibling;
			index += node[ContentLength] || 0;
		}
	}

	return index;
}

function createParentNodeOffset(node: Node): [Node | null, number] {
	const parentNode = node.parentNode;
	if (parentNode === null) {
		throw new Error("Node has no parent");
	}

	const offset = Array.from(parentNode.childNodes).indexOf(node as ChildNode);
	return [parentNode, offset];
}

function findSuccessorNode(walker: TreeWalker): Node | null {
	let node: Node | null = walker.currentNode;
	while (node !== null) {
		node = walker.nextSibling();
		if (node === null) {
			node = walker.parentNode();
		} else {
			return node;
		}
	}

	return null;
}

// TODO: Stop exporting this function
export function nodeOffsetFromIndex(
	root: Node,
	index: number,
): [Node | null, number] {
	if (index < 0) {
		return [null, 0];
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	let node: Node | null = root;
	let offset = index;
	while (node !== null) {
		const length = node[ContentLength] || 0;
		if (offset <= length) {
			if (node.nodeType === Node.TEXT_NODE) {
				return [node, offset];
			}

			const firstChild = walker.firstChild();
			if (firstChild) {
				offset -= firstChild[ContentOffset] || 0;
				node = firstChild;
			} else if (offset > 0) {
				const successor = findSuccessorNode(walker);
				if (successor) {
					if (successor.nodeName === "BR") {
						return createParentNodeOffset(successor);
					}

					return [successor, 0];
				} else {
					break;
				}
			} else if (node.nodeName === "BR") {
				return createParentNodeOffset(node);
			} else {
				return [node, 0];
			}
		} else {
			offset -= length;
			const nextSibling = walker.nextSibling();
			if (nextSibling) {
				node = nextSibling;
			} else {
				const successor = findSuccessorNode(walker);
				if (successor) {
					if (successor.nodeName === "BR") {
						return createParentNodeOffset(successor);
					}

					return [successor, 0];
				} else {
					break;
				}
			}
		}
	}

	return [
		root,
		root.nodeType === Node.TEXT_NODE
			? (root as Text).data.length
			: root.childNodes.length,
	];
}

export type SelectionDirection = "forward" | "backward" | "none";

export interface SelectionInfo {
	selectionStart: number;
	selectionEnd: number;
	selectionDirection: SelectionDirection;
}

function getSelectionInfo(area: ContentAreaElement): SelectionInfo {
	const selection = document.getSelection();
	if (selection === null) {
		return area[$selectionInfo];
	}

	const focus = indexFromNodeOffset(
		area,
		selection.focusNode,
		selection.focusOffset,
	);

	let anchor: number;
	if (selection.isCollapsed) {
		anchor = focus;
	} else {
		anchor = indexFromNodeOffset(
			area,
			selection.anchorNode,
			selection.anchorOffset,
		);
	}

	if (focus === -1 || anchor === -1) {
		return area[$selectionInfo];
	}

	const selectionStart = Math.min(focus, anchor);
	const selectionEnd = Math.max(focus, anchor);
	const selectionDirection: SelectionDirection =
		focus === anchor ? "none" : focus < anchor ? "backward" : "forward";
	return {selectionStart, selectionEnd, selectionDirection};
}

// TODO: incorporate this code somewhere.
//let undoing = false;
//el.addEventListener("beforeinput", (ev: InputEvent) => {
//	if (ev.inputType !== "historyUndo" && undoing) {
//		ev.preventDefault();
//	}
//});
//
//el.addEventListener("input", (ev: InputEvent) => {
//	if (ev.inputType === "historyUndo") {
//		return;
//	}
//
//	undoing = true;
//	requestAnimationFrame(() => {
//		document.execCommand("undo");
//		undoing = false;
//	});
//});

// TODO: maybe some of these properties can be moved to a hidden controller type
// symbol properties
const $value = Symbol.for("ContentArea.$value");
const $observer = Symbol.for("ContentArea.$observer");
const $selectionInfo = Symbol.for("ContentArea.$selectionInfo");
const $onselectionchange = Symbol.for("ContentArea.$onselectionchange");
const $slot = Symbol.for("ContentArea.$slot");
const css = `
:host {
	display: contents;
	white-space: break-spaces;
}`;

export class ContentChangeEvent extends CustomEvent<{patch: Patch}> {
	// TODO: Align second parameter with other event constructors
	constructor(typeArg: string, patch: Patch) {
		super(typeArg, {detail: {patch}, bubbles: true});
	}
}

export class ContentAreaElement extends HTMLElement {
	[$value]: string;
	[$slot]: HTMLSlotElement;
	[$selectionInfo]: SelectionInfo;
	[$observer]: MutationObserver;
	[$onselectionchange]: (ev: Event) => unknown;

	static get observedAttributes(): Array<string> {
		return ["contenteditable"];
	}

	constructor() {
		super();
		this[$value] = "";
		this[$selectionInfo] = {
			selectionStart: 0,
			selectionEnd: 0,
			selectionDirection: "none",
		};
		this[$observer] = new MutationObserver((records) =>
			validate(this, records),
		);
		this[$onselectionchange] = () => validate(this);
		const shadow = this.attachShadow({mode: "closed"});
		const style = document.createElement("style");
		style.textContent = css;
		shadow.appendChild(style);
		const slot = document.createElement("slot");
		this[$slot] = slot;
		slot.contentEditable = this.contentEditable;
		shadow.appendChild(slot);
		this.addEventListener("focusin", () => {
			const {selectionStart, selectionEnd, selectionDirection} = this[
				$selectionInfo
			];
			this.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
		});
	}

	connectedCallback() {
		// TODO: listen to attributes like contenteditable, data-contentbefore, data-content
		this[$observer].observe(this, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		document.addEventListener("selectionchange", this[$onselectionchange]);
	}

	disconnectedCallback() {
		this[$observer].disconnect();
		// JSDOM-based environments like jest will make the global document null
		// before calling the disconnectedCallback.
		if (document) {
			clean(this);
			document.removeEventListener("selectionchange", this[$onselectionchange]);
		}
	}

	attributeChangedCallback(
		name: string,
		//oldValue: string,
		//newValue: string,
	) {
		switch (name) {
			case "contenteditable": {
				const slot = this[$slot];
				// We have to set slot.contentEditable to this.contentEditable because
				// Chrome has trouble selecting elements across shadow DOM boundaries.
				// See https://bugs.chromium.org/p/chromium/issues/detail?id=1175930

				// Chrome has additional issues with using the host element as a
				// contenteditable element but this normalizes some behavior.
				slot.contentEditable = this.contentEditable;
				break;
			}
		}
	}

	get value(): string {
		validate(this);
		return this[$value];
	}

	get selectionStart(): number {
		return this[$selectionInfo].selectionStart;
	}

	set selectionStart(selectionStart: number) {
		const {selectionEnd, selectionDirection} = this[$selectionInfo];
		this.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
	}

	get selectionEnd(): number {
		return this[$selectionInfo].selectionEnd;
	}

	set selectionEnd(selectionEnd: number) {
		const {selectionStart, selectionDirection} = this[$selectionInfo];
		this.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
	}

	get selectionDirection(): SelectionDirection {
		return this[$selectionInfo].selectionDirection;
	}

	set selectionDirection(selectionDirection: SelectionDirection) {
		const {selectionStart, selectionEnd} = this[$selectionInfo];
		this.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
	}

	setSelectionRange(
		selectionStart: number,
		selectionEnd: number,
		selectionDirection: SelectionDirection = "none",
	): void {
		const selection = document.getSelection();
		if (!selection) {
			return;
		}

		validate(this);
		// We bound selection range to the length of value minus the trailing
		// newline because attempting to select after the first newline when there
		// is only newline can cause the editable area to lose focus.
		const length = this[$value].replace(/(\r|\n|\r\n)$/, "").length;
		selectionStart = selectionStart || 0;
		selectionEnd = selectionEnd || 0;
		selectionStart = Math.max(0, Math.min(selectionStart, length));
		selectionEnd = Math.max(0, Math.min(selectionEnd, length));
		if (selectionEnd < selectionStart) {
			selectionStart = selectionEnd;
		}

		let anchor: number;
		let focus: number;
		if (selectionDirection === "backward") {
			anchor = selectionEnd;
			focus = selectionStart;
		} else {
			anchor = selectionStart;
			focus = selectionEnd;
		}

		if (anchor === focus) {
			const [node, offset] = nodeOffsetFromIndex(this, focus);
			if (
				selection.focusNode !== node ||
				selection.focusOffset !== offset ||
				// Chrome seems to draw collapsed selections which point to a BR element
				// incorrectly when there are two adjacent BR elements and one has been
				// deleted backward, so we force a redraw of the selection.
				(node &&
					node.nodeType === Node.ELEMENT_NODE &&
					node.childNodes[offset] &&
					node.childNodes[offset].nodeName === "BR")
			) {
				selection.collapse(node, offset);
			}
		} else {
			const [anchorNode, anchorOffset] = nodeOffsetFromIndex(this, anchor);
			const [focusNode, focusOffset] = nodeOffsetFromIndex(this, focus);
			if (anchorNode === null && focusNode === null) {
				selection.collapse(null);
			} else if (anchorNode === null) {
				if (
					selection.focusNode !== focusNode ||
					selection.focusOffset !== focusOffset
				) {
					selection.collapse(focusNode, focusOffset);
				}
			} else if (focusNode === null) {
				if (
					selection.anchorNode !== anchorNode ||
					selection.anchorOffset !== anchorOffset
				) {
					selection.collapse(anchorNode, anchorOffset);
				}
			} else {
				if (
					selection.focusNode !== focusNode ||
					selection.focusOffset !== focusOffset ||
					selection.anchorNode !== anchorNode ||
					selection.anchorOffset !== anchorOffset
				) {
					// TODO: IE support or nah?
					selection.setBaseAndExtent(
						anchorNode,
						anchorOffset,
						focusNode,
						focusOffset,
					);
				}
			}
		}
	}
}

function validate(
	area: ContentAreaElement,
	records?: Array<MutationRecord> | undefined,
): void {
	if (records === undefined) {
		records = area[$observer].takeRecords();
	}

	invalidate(area, records);
	const oldValue = area[$value];
	const oldSelectionInfo = area[$selectionInfo];
	const value = (area[$value] = getContent(area, area[$value]));
	const selectionInfo = (area[$selectionInfo] = getSelectionInfo(area));
	if (records.length) {
		const patch = Patch.diff(
			oldValue,
			value,
			Math.min(oldSelectionInfo.selectionStart, selectionInfo.selectionStart),
		);
		area.dispatchEvent(new ContentChangeEvent("contentchange", patch));
		// TODO: figure out how to deal with infinite validate loops.
		area.setSelectionRange(
			selectionInfo.selectionStart,
			selectionInfo.selectionEnd,
			selectionInfo.selectionDirection,
		);
	}
}
