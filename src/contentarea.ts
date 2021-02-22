/// <reference lib="dom" />

import type {Cursor} from "./patch";
import {Patch} from "./patch";

export interface NodeInfo {
	offset: number;
	length: number;
}

export type NodeInfoCache = Map<Node, NodeInfo>;

export type SelectionDirection = "forward" | "backward" | "none";

interface SelectionInfo {
	selectionStart: number;
	selectionEnd: number;
	selectionDirection: SelectionDirection;
}

export interface ContentChangeEventDetail {
	patch: Patch;
}

export interface ContentChangeEventInit
	extends CustomEventInit<ContentChangeEventDetail> {}

export class ContentChangeEvent extends CustomEvent<ContentChangeEventDetail> {
	constructor(typeArg: string, eventInit: ContentChangeEventInit) {
		// Maybe we should do some runtime eventInit validation.
		super(typeArg, {bubbles: true, ...eventInit});
	}
}

const css = `
:host {
	display: contents;
	white-space: pre-wrap;
	white-space: break-spaces;
	overflow-wrap: break-word;
	word-break: break-all;
}`;

// TODO: Maybe these properties can be grouped on a hidden controller class?
/*** ContentAreaElement symbol properties ***/
const $cache = Symbol.for("revise$cache");
const $value = Symbol.for("revise$value");
const $cursor = Symbol.for("revise$cursor");
const $slot = Symbol.for("revise$slot");
const $observer = Symbol.for("revise$observer");
const $onselectionchange = Symbol.for("revise$onselectionchange");

export class ContentAreaElement extends HTMLElement {
	[$cache]: NodeInfoCache;
	[$value]: string;
	[$cursor]: Cursor;
	[$slot]: HTMLSlotElement;
	[$observer]: MutationObserver;
	[$onselectionchange]: (ev: Event) => unknown;

	static get observedAttributes(): Array<string> {
		return ["contenteditable"];
	}

	constructor() {
		super();
		this[$cache] = new Map();
		this[$value] = "";
		this[$cursor] = 0;

		const shadow = this.attachShadow({mode: "closed"});
		const style = document.createElement("style");
		style.textContent = css;
		shadow.appendChild(style);
		const slot = document.createElement("slot");
		this[$slot] = slot;
		slot.contentEditable = this.contentEditable;
		shadow.appendChild(slot);

		this.addEventListener("focusin", () => {
			const {
				selectionStart,
				selectionEnd,
				selectionDirection,
			} = selectionInfoFromCursor(this[$cursor]);
			this.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
		});

		// TODO: Should we consider passing input event information to this function?
		this.addEventListener("input", () => validate(this));

		this[$observer] = new MutationObserver((records) => {
			validate(this, records);
		});

		// Because this listener is added to the document, we have to add and
		// remove the listener in the connected callback.
		this[$onselectionchange] = () => {
			validate(this);
			const cursor = getCursor(this, this[$cache]);
			if (cursor !== -1) {
				this[$cursor] = cursor;
			}
		};
	}

	connectedCallback() {
		// TODO: Figure out a way to call validate here instead
		this[$value] = getValueAndMarkNodes(this, this[$cache], this[$value]);
		const cursor = getCursor(this, this[$cache]);
		if (cursor !== -1) {
			this[$cursor] = cursor;
		}

		this[$observer].observe(this, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: [
				"data-content",
				"data-contentbefore",
				"data-contentafter",
			],
		});

		document.addEventListener("selectionchange", this[$onselectionchange]);
	}

	disconnectedCallback() {
		this[$cache].clear();
		this[$observer].disconnect();
		// JSDOM-based environments like jest will make the global document null
		// before calling the disconnectedCallback.
		if (document) {
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
				// contenteditable element but this normalizes some of the behavior.
				slot.contentEditable = this.contentEditable;
				break;
			}
		}
	}

	get value(): string {
		validate(this);
		return this[$value];
	}

	nodeOffsetAt(index: number): [Node | null, number] {
		validate(this);
		const cache = this[$cache];
		return nodeOffsetAt(this, cache, index);
	}

	indexOf(node: Node | null, offset: number): number {
		validate(this);
		const cache = this[$cache];
		return indexOf(this, cache, node, offset);
	}

	get selectionStart(): number {
		validate(this);
		return selectionInfoFromCursor(this[$cursor]).selectionStart;
	}

	set selectionStart(selectionStart: number) {
		validate(this);
		const value = this[$value];
		const cache = this[$cache];
		const {selectionEnd, selectionDirection} = selectionInfoFromCursor(
			this[$cursor],
		);
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	get selectionEnd(): number {
		validate(this);
		return selectionInfoFromCursor(this[$cursor]).selectionEnd;
	}

	set selectionEnd(selectionEnd: number) {
		validate(this);
		const value = this[$value];
		const cache = this[$cache];
		const {selectionStart, selectionDirection} = selectionInfoFromCursor(
			this[$cursor],
		);
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	get selectionDirection(): SelectionDirection {
		validate(this);
		return selectionInfoFromCursor(this[$cursor]).selectionDirection;
	}

	set selectionDirection(selectionDirection: SelectionDirection) {
		validate(this);
		const cache = this[$cache];
		const value = this[$value];
		const {selectionStart, selectionEnd} = selectionInfoFromCursor(
			this[$cursor],
		);
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	setSelectionRange(
		selectionStart: number,
		selectionEnd: number,
		selectionDirection: SelectionDirection = "none",
	): void {
		validate(this);
		const cache = this[$cache];
		const value = this[$value];
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	repair(callback: Function): void {
		validate(this);
		const cache = this[$cache];
		const value = this[$value];
		const {
			selectionStart,
			selectionEnd,
			selectionDirection,
		} = selectionInfoFromCursor(this[$cursor]);
		callback();
		validate(this);
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}
}

function validate(
	area: ContentAreaElement,
	records: Array<MutationRecord> = area[$observer].takeRecords(),
): void {
	const cache = area[$cache];
	invalidate(area, cache, records);
	if (records.length) {
		const oldValue = area[$value];
		const oldCursor = area[$cursor];
		const value = (area[$value] = getValueAndMarkNodes(area, cache, oldValue));
		const cursor = getCursor(area, cache);
		if (cursor !== -1) {
			area[$cursor] = cursor;
		}

		const hint = Math.min(
			...(Array.isArray(oldCursor) ? oldCursor : [oldCursor]),
			...(Array.isArray(cursor) ? cursor : [cursor]),
		);
		const patch = Patch.diff(oldValue, value, hint);
		area.dispatchEvent(
			new ContentChangeEvent("contentchange", {detail: {patch}}),
		);
	}
}

// TODO: PARAMETERIZE NEWLINE BEHAVIOR?
const NEWLINE = "\n";

// TODO: PARAMETERIZE BLOCKLIKE ELEMENTS?
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

function clean(root: Node, cache: NodeInfoCache): void {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (let node: Node | null = root; node !== null; node = walker.nextNode()) {
		cache.delete(node);
	}
}

function invalidate(
	root: Element,
	cache: NodeInfoCache,
	records: Array<MutationRecord>,
): void {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		for (let j = 0; j < record.addedNodes.length; j++) {
			clean(record.addedNodes[j], cache);
		}

		for (let j = 0; j < record.removedNodes.length; j++) {
			clean(record.removedNodes[j], cache);
		}

		let node = record.target;
		if (node === root) {
			invalidated = true;
			continue;
		} else if (!cache.has(node) || !root.contains(node)) {
			continue;
		}

		for (; node !== root; node = node.parentNode!) {
			if (!cache.has(node)) {
				break;
			}

			cache.delete(node);
			invalidated = true;
		}
	}

	if (invalidated) {
		cache.delete(root);
	}
}

interface StackFrame {
	oldIndexRelative: number;
	nodeInfo: NodeInfo;
}

// TODO: It might be faster to construct a patch rather than concatenating a giant string.
function getValueAndMarkNodes(
	root: Element,
	cache: NodeInfoCache,
	oldValue: string,
): string {
	if (cache.has(root)) {
		const {length} = cache.get(root)!;
		if (oldValue.length !== length) {
			throw new Error("oldValue does not match cached root length");
		}

		return oldValue;
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	let content = "";
	let hasNewline = false;
	// index into the old string
	let oldIndex = 0;
	// index into the old string of the first sibling of the current node
	let oldIndexRelative = 0;
	// the offset of the current node relative to its parent
	let offset = 0;
	let nodeInfo: NodeInfo = {offset, length: 0};
	const seen = new Set<Node>();
	const stack: Array<StackFrame> = [];
	for (let node: Node | null = root; node !== null; ) {
		if (!seen.has(node)) {
			while (!cache.has(node)) {
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

		if (cache.has(node)) {
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
			} else if (!hasNewline && isBlocklikeElement(node)) {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}

			nodeInfo.length = offset - nodeInfo.offset;
		}

		cache.set(node, nodeInfo);
		node = walker.nextSibling();
		if (node === null && walker.currentNode !== root) {
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

function indexOf(
	root: Element,
	cache: NodeInfoCache,
	node: Node | null,
	offset: number,
) {
	if (node == null || !root.contains(node)) {
		return -1;
	}

	let index = offset;
	// TODO: handle the node being missing from the cache when we do widgets
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
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	walker.currentNode = node;
	while (node !== null && node !== root) {
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

function nodeOffsetAt(
	root: Element,
	cache: NodeInfoCache,
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
		if (!cache.has(node)) {
			throw new Error("Unknown node");
		}

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

	return [root, root.childNodes.length];
}

function getCursor(root: Element, cache: NodeInfoCache): Cursor {
	const selection = document.getSelection();
	if (selection == null) {
		return -1;
	}
	const focus = indexOf(
		root,
		cache,
		selection.focusNode,
		selection.focusOffset,
	);
	let anchor: number;
	if (selection.isCollapsed) {
		anchor = focus;
	} else {
		anchor = indexOf(root, cache, selection.anchorNode, selection.anchorOffset);
	}

	if (focus === anchor || anchor === -1) {
		return focus;
	} else if (focus === -1) {
		return anchor;
	}

	return [anchor, focus];
}

function selectionInfoFromCursor(cursor: Cursor): SelectionInfo {
	if (cursor === -1) {
		// We do not allow the cursor to be -1 in the ContentAreaElement,
		// preferring to keep the last known cursor instead.
		// Nevertheless, we return the default selection just in case here.
		return {selectionStart: 0, selectionEnd: 0, selectionDirection: "none"};
	}

	let selectionStart: number;
	let selectionEnd: number;
	let selectionDirection: SelectionDirection = "none";
	if (Array.isArray(cursor)) {
		selectionStart = Math.max(0, Math.min.apply(null, cursor));
		selectionEnd = Math.max(0, Math.max.apply(null, cursor));
		selectionDirection = cursor[0] <= cursor[1] ? "forward" : "backward";
	} else {
		selectionStart = selectionEnd = cursor;
	}

	return {selectionStart, selectionEnd, selectionDirection};
}

// TODO: Maybe we can have the internal function work with cursors instead.
function setSelectionRange(
	root: Element,
	cache: NodeInfoCache,
	value: string,
	selectionStart: number,
	selectionEnd: number,
	selectionDirection: SelectionDirection,
): void {
	const selection = document.getSelection();
	if (!selection) {
		return;
	}

	// We bound selection range to the length of value minus the trailing newline
	// because attempting to select after the first newline when there is only
	// one can cause the editable root to lose focus.
	const length = value.replace(/(\r|\n|\r\n)$/, "").length;
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
		const [node, offset] = nodeOffsetAt(root, cache, focus);
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
		const [anchorNode, anchorOffset] = nodeOffsetAt(root, cache, anchor);
		const [focusNode, focusOffset] = nodeOffsetAt(root, cache, focus);
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
		} else if (
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
