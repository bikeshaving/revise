/// <reference lib="dom" />
import {Patch} from "./patch";

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

function clean(area: ContentAreaElement, root: Node = area): void {
	const cache = area[$cache];
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	for (let node: Node | null = root; node !== null; node = walker.nextNode()) {
		cache.delete(node);
	}
}

function invalidate(
	area: ContentAreaElement,
	records: Array<MutationRecord>,
): void {
	const cache = area[$cache];
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		for (let j = 0; j < record.addedNodes.length; j++) {
			clean(area, record.addedNodes[j]);
		}

		for (let j = 0; j < record.removedNodes.length; j++) {
			clean(area, record.removedNodes[j]);
		}

		let node = record.target;
		if (node === area) {
			invalidated = true;
			continue;
		} else if (!cache.has(node) || !area.contains(node)) {
			continue;
		}

		for (; node !== area; node = node.parentNode!) {
			if (!cache.has(node)) {
				break;
			}

			cache.delete(node);
			invalidated = true;
		}
	}

	if (invalidated) {
		cache.delete(area);
	}
}

function validate(
	area: ContentAreaElement,
	records?: Array<MutationRecord> | undefined,
	ignore = false,
): void {
	if (records === undefined) {
		records = area[$observer].takeRecords();
	}

	invalidate(area, records);
	if (records.length) {
		const oldValue = area[$value];
		const oldSelectionInfo = area[$selectionInfo];
		const value = (area[$value] = getValueAndMarkNodes(area, area[$value]));
		const selectionInfo = (area[$selectionInfo] = getSelectionInfo(area));
		if (ignore) {
			return;
		}

		const patch = Patch.diff(
			oldValue,
			value,
			Math.min(oldSelectionInfo.selectionStart, selectionInfo.selectionStart),
		);
		area.dispatchEvent(new ContentChangeEvent("contentchange", patch));
		const records1 = area[$observer].takeRecords();
		if (records1.length) {
			validate(area, records1, true);
			area.setSelectionRange(
				selectionInfo.selectionStart,
				selectionInfo.selectionEnd,
				selectionInfo.selectionDirection,
			);
		}
	}
}

function nodeOffsetFromChild(node: Node): [Node | null, number] {
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

interface NodeInfo {
	offset: number;
	length: number;
}

interface StackFrame {
	oldIndexRelative: number;
	nodeInfo: NodeInfo;
}

// TODO: It might be faster to construct a patch rather than concatenating a string.
function getValueAndMarkNodes(
	area: ContentAreaElement,
	oldValue?: string,
): string {
	const cache = area[$cache];
	if (oldValue && cache.has(area)) {
		const {length} = cache.get(area)!;
		if (oldValue.length !== length) {
			throw new Error("oldValue does not match area length");
		}

		return oldValue;
	}

	const walker = document.createTreeWalker(
		area,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	let content = "";
	let hasNewline = false;
	let oldIndex = 0;
	let oldIndexRelative = 0;
	let offset = 0;
	const seen = new Set<Node>();
	const stack: Array<StackFrame> = [];
	let nodeInfo: NodeInfo = {offset, length: 0};
	// TODO: the stack is mostly unnecessary for the area, maybe we can start with the firstChild
	for (let node: Node | null = area; node !== null; ) {
		if (!seen.has(node)) {
			while (!oldValue || !cache.has(node)) {
				const newlineBefore = !hasNewline && offset && isBlocklikeElement(node);
				if (newlineBefore) {
					content += NEWLINE;
					hasNewline = true;
				}

				const firstChild = walker.firstChild();
				if (firstChild) {
					stack.push({oldIndexRelative, nodeInfo});
					oldIndexRelative = oldIndex;
					if (newlineBefore) {
						offset = NEWLINE.length;
					} else {
						offset = 0;
					}

					nodeInfo = {offset, length: 0};
					seen.add(node);
					node = firstChild;
				} else {
					break;
				}
			}
		}

		if (oldValue && cache.has(node)) {
			nodeInfo = cache.get(node)!;
			const oldOffset = oldIndex - oldIndexRelative;
			if (oldOffset < nodeInfo.offset) {
				// A deletion has been detected.
				oldIndex += nodeInfo.offset - oldOffset;
			}

			nodeInfo.offset = offset;
			const length = nodeInfo.length;
			const content1 = oldValue.slice(oldIndex, oldIndex + length);
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

			nodeInfo.length = offset - nodeInfo.offset;
		}

		cache.set(node, nodeInfo);
		node = walker.nextSibling();
		if (node === null && walker.currentNode !== area) {
			if (!stack.length) {
				throw new Error("Stack is empty");
			}

			({oldIndexRelative, nodeInfo} = stack.pop()!);
			offset += nodeInfo.offset;
			node = walker.parentNode();
		} else {
			nodeInfo = {offset, length: 0};
		}
	}

	return content;
}

export type SelectionDirection = "forward" | "backward" | "none";

interface SelectionInfo {
	selectionStart: number;
	selectionEnd: number;
	selectionDirection: SelectionDirection;
}

function getSelectionInfo(area: ContentAreaElement): SelectionInfo {
	const selection = document.getSelection();
	if (selection === null) {
		return area[$selectionInfo];
	}

	const focus = area.indexOf(selection.focusNode, selection.focusOffset);
	let anchor: number;
	if (selection.isCollapsed) {
		anchor = focus;
	} else {
		anchor = area.indexOf(selection.anchorNode, selection.anchorOffset);
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

export class ContentChangeEvent extends CustomEvent<{patch: Patch}> {
	// TODO: Align second parameter with other event constructors
	constructor(typeArg: string, patch: Patch) {
		super(typeArg, {detail: {patch}, bubbles: true});
	}
}

// TODO: maybe some of these properties can be moved to a hidden controller type
// symbol properties
const $value = Symbol.for("ContentArea.$value");
const $cache = Symbol.for("ContentArea.$cache");
const $observer = Symbol.for("ContentArea.$observer");
const $selectionInfo = Symbol.for("ContentArea.$selectionInfo");
const $onselectionchange = Symbol.for("ContentArea.$onselectionchange");
const $slot = Symbol.for("ContentArea.$slot");
const css = `
:host {
	display: contents;
	white-space: break-spaces;
	word-break: break-all;
}`;

export class ContentAreaElement extends HTMLElement {
	[$value]: string;
	[$cache]: Map<Node, NodeInfo>;
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
		this[$cache] = new Map();
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
		this.addEventListener("input", () => validate(this));
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
		this[$cache].clear();
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

	nodeOffsetAt(index: number): [Node | null, number] {
		if (index < 0) {
			return [null, 0];
		}

		validate(this);
		const cache = this[$cache];
		const walker = document.createTreeWalker(
			this,
			NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
		);

		let node: Node | null = this;
		let offset = index;
		while (node !== null) {
			const {length} = cache.get(node)!;
			if (offset <= length) {
				if (node.nodeType === Node.TEXT_NODE) {
					return [node, offset];
				}

				const firstChild = walker.firstChild();
				if (firstChild) {
					offset -= cache.get(firstChild)!.offset;
					node = firstChild;
				} else if (offset > 0) {
					const successor = findSuccessorNode(walker);
					if (successor) {
						if (successor.nodeName === "BR") {
							return nodeOffsetFromChild(successor);
						}

						return [successor, 0];
					} else {
						break;
					}
				} else if (node.nodeName === "BR") {
					return nodeOffsetFromChild(node);
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
							return nodeOffsetFromChild(successor);
						}

						return [successor, 0];
					} else {
						break;
					}
				}
			}
		}

		return [this, this.childNodes.length];
	}

	indexOf(node: Node | null, offset: number): number {
		if (node == null || !this.contains(node)) {
			return -1;
		}

		validate(this);
		const cache = this[$cache];
		let index = offset;
		if (node.nodeType === Node.ELEMENT_NODE) {
			if (offset >= node.childNodes.length) {
				if (index > 0) {
					index = cache.get(node)!.length;
				}
			} else {
				node = node.childNodes[offset];
				index = 0;
			}
		}

		const walker = document.createTreeWalker(
			this,
			NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
		);
		walker.currentNode = node;
		while (node !== null && node !== this) {
			const previousSibling = walker.previousSibling();
			if (previousSibling === null) {
				const parentNode = walker.parentNode();
				if (parentNode) {
					index += cache.get(node)!.offset;
				}

				node = parentNode;
			} else {
				node = previousSibling;
				index += cache.get(node)!.length;
			}
		}

		return index;
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
			const [node, offset] = this.nodeOffsetAt(focus);
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
			const [anchorNode, anchorOffset] = this.nodeOffsetAt(anchor);
			const [focusNode, focusOffset] = this.nodeOffsetAt(focus);
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
