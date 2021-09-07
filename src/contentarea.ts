/// <reference lib="dom" />
import {Patch} from "./patch";

export interface ContentEventDetail {
	patch: Patch;
	// TODO: add information about changed ranges
}

export interface ContentEventInit extends CustomEventInit<ContentEventDetail> {}

export class ContentEvent extends CustomEvent<ContentEventDetail> {
	constructor(typeArg: string, eventInit: ContentEventInit) {
		// Maybe we should do some runtime eventInit validation.
		super(typeArg, {bubbles: true, ...eventInit});
	}
}

/** Whether the node or its children have been mutated */
const IS_VALID = 1 << 0;
/** Whether the node is responsible for the newline before it. */
const PREPENDS_NEWLINE = 1 << 1;
/** Whether the node is responsible for the newline after it. */
const APPENDS_NEWLINE = 1 << 2;

interface NodeInfo {
	/** A bitmask (see flags above) */
	flags: number;
	/** The start of this node’s contents relative to the start of the parent. */
	offset: number;
	/** The length of this node’s contents. */
	length: number;
}

type NodeInfoCache = Map<Node, NodeInfo>;

/********************************************/
/*** ContentAreaElement symbol properties ***/
/********************************************/
const $slot = Symbol.for("revise$slot");
const $cache = Symbol.for("revise$cache");
const $observer = Symbol.for("revise$observer");
const $value = Symbol.for("revise$value");
const $selectionRange = Symbol.for("revise$selectionRange");
const $onselectionchange = Symbol.for("revise$onselectionchange");

const css = `
:host {
	display: contents;
	white-space: pre-wrap;
	white-space: break-spaces;
	overflow-wrap: break-word;
}`;

export class ContentAreaElement extends HTMLElement implements SelectionRange {
	[$value]: string;
	[$cache]: NodeInfoCache;
	[$observer]: MutationObserver;
	[$slot]: HTMLSlotElement;
	[$selectionRange]: SelectionRange;
	[$onselectionchange]: (ev: Event) => unknown;

	constructor() {
		super();
		this[$value] = "";
		this[$cache] = new Map();
		this[$selectionRange] = {
			selectionStart: 0,
			selectionEnd: 0,
			selectionDirection: "none",
		};
		const shadow = this.attachShadow({mode: "closed"});
		const style = document.createElement("style");
		style.textContent = css;
		shadow.appendChild(style);
		const slot = document.createElement("slot");
		this[$slot] = slot;
		slot.contentEditable = this.contentEditable;
		shadow.appendChild(slot);

		this[$observer] = new MutationObserver((records) =>
			validate(this, records),
		);

		this[$onselectionchange] = () => {
			this[$selectionRange] = getSelectionRange(this, this[$cache]);
		};
	}

	/******************************/
	/*** Custom Element methods ***/
	/******************************/
	static get observedAttributes(): Array<string> {
		return ["contenteditable"];
	}

	connectedCallback() {
		validate(this, []);
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
		// JSDOM-based environments like Jest will make the global document null
		// before calling the disconnectedCallback for some reason.
		if (document) {
			document.removeEventListener("selectionchange", this[$onselectionchange]);
		}
	}

	attributeChangedCallback(name: string) {
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

	/***********************/
	/*** Content methods ***/
	/***********************/
	get value(): string {
		validate(this, this[$observer].takeRecords());
		return this[$value];
	}

	get selectionStart(): number {
		validate(this, this[$observer].takeRecords());
		return this[$selectionRange].selectionStart;
	}

	set selectionStart(selectionStart: number) {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		const selectionRange = this[$selectionRange];
		const {selectionEnd, selectionDirection} = selectionRange;
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

	get selectionEnd(): number {
		validate(this, this[$observer].takeRecords());
		return this[$selectionRange].selectionEnd;
	}

	set selectionEnd(selectionEnd: number) {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		const selectionRange = this[$selectionRange];
		const {selectionStart, selectionDirection} = selectionRange;
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

	get selectionDirection(): SelectionDirection {
		validate(this, this[$observer].takeRecords());
		return this[$selectionRange].selectionDirection;
	}

	set selectionDirection(selectionDirection: SelectionDirection) {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		const selectionRange = this[$selectionRange];
		const {selectionStart, selectionEnd} = selectionRange;
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

	setSelectionRange(
		selectionStart: number,
		selectionEnd: number,
		selectionDirection: SelectionDirection = "none",
	): void {
		validate(this, this[$observer].takeRecords());
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

	indexAt(node: Node | null, offset: number): number {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		return indexAt(this, cache, node, offset);
	}

	nodeOffsetAt(index: number): [Node | null, number] {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		return nodeOffsetAt(this, cache, index);
	}
}

// TODO: custom newlines?
const NEWLINE = "\n";

// TODO: Allow the list of block-like elements to be overridden with an
// attribute.
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

function validate(
	root: ContentAreaElement,
	records: Array<MutationRecord>,
): boolean {
	const cache = root[$cache];
	if (invalidate(root, cache, records)) {
		const oldValue = root[$value];
		const oldSelectionRange = root[$selectionRange];
		const value = (root[$value] = getContent(root, cache, oldValue));
		const selectionRange = (root[$selectionRange] = getSelectionRange(
			root,
			cache,
		));
		const hint = Math.min(
			oldSelectionRange.selectionStart,
			selectionRange.selectionStart,
		);
		// TODO: This call is expensive. If we have getContent return a patch
		// instead of a string, we might be able to save a lot in CPU time.
		const patch = Patch.diff(oldValue, value, hint);
		root.dispatchEvent(new ContentEvent("contentchange", {detail: {patch}}));
		return true;
	}

	return false;
}

// This is the single most complicated function in the library!!!
/**
 * This function returns the content of the root (always a content-area
 * element, and populates the cache with info about the contents of nodes for
 * future reads.
 * @param root - The root element (usually a content-area element)
 * @param cache - The nodeInfo cache associated with the root
 * @param oldContent - The previous content of the root.
 */
function getContent(
	root: Element,
	cache: NodeInfoCache,
	oldContent: string,
): string {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	// TODO: It might be faster to construct and return a patch rather than
	// concatenating a giant string.
	let content = "";
	// Because the content variable is a heavily concatenated string and likely
	// inferred by most engines as requiring a “rope-like” data structure for
	// performance, reading from the end of the string to detect newlines can be
	// a bottleneck. Therefore, we store that info in this boolean instead.
	/** A boolean which indicates whether content currently ends in a newline. */
	let hasNewline = false;
	/** The start of the current node relative to its parent. */
	let offset = 0;
	// The current index into oldContent. We use this to copy unchanged text over
	// and track deletions.
	// If there are nodes which have cached start and length information, we get
	// their contents from oldContent string using oldIndex so we don’t have to
	// read it from the DOM.
	let oldIndex = 0;
	// The current index into oldContent of the current node’s parent. We can get
	// the expected start of a node if none of the nodes before it were deleted
	// by finding the difference between oldIndex and relativeOldIndex. We can
	// compare this difference to the cached start information to detect
	// deletions.
	let relativeOldIndex = 0;
	let info: NodeInfo = cache.get(root)!;
	if (info === undefined) {
		info = {flags: 0, offset, length: 0};
		cache.set(root, info);
	}

	// A stack to save some variables as we walk up and down the tree.
	const stack: Array<{relativeOldIndex: number; info: NodeInfo}> = [];
	for (let node: Node | null = root, descending = true; node !== null; ) {
		// A loop to descend into the DOM tree.
		while (descending && !(info.flags & IS_VALID)) {
			if (
				node.nodeType === Node.TEXT_NODE ||
				// We treat elements with data-content attributes as opaque.
				(node as Element).hasAttribute("data-content")
			) {
				break;
			}

			// If the current node is a block-like element, and the previous
			// node/elements did not end with a newline, then the current element
			// would introduce a linebreak before its contents.
			// We check that the offset is non-zero so that the first child of a
			// parent does not introduce a newline before it.
			const prependsNewline =
				!!offset && !hasNewline && isBlocklikeElement(node);
			if (prependsNewline) {
				content += NEWLINE;
				hasNewline = true;
				offset += NEWLINE.length;
				info.offset += NEWLINE.length;
				info.flags |= PREPENDS_NEWLINE;
			} else {
				info.flags &= ~PREPENDS_NEWLINE;
			}

			if ((node = walker.firstChild())) {
				descending = true;
			} else {
				node = walker.currentNode;
				break;
			}

			stack.push({relativeOldIndex, info});
			relativeOldIndex = oldIndex;
			offset = 0;
			// getNodeInfo
			info = cache.get(node)!;
			if (info === undefined) {
				info = {flags: 0, offset, length: 0};
				cache.set(node, info);
			} else {
				if (info.offset > 0) {
					// deletion detected
					oldIndex += info.offset;
				}

				info.offset = offset;
			}
		}

		if (info.flags & IS_VALID) {
			// The node has been seen before.
			// Reading from oldContent because length hasn’t been invalidated.
			const length = info.length;
			if (oldIndex + info.length > oldContent.length) {
				throw new Error("String length mismatch");
			}

			const prependsNewline =
				!!offset && !hasNewline && isBlocklikeElement(node);
			if (prependsNewline) {
				content += NEWLINE;
				hasNewline = true;
				offset += NEWLINE.length;
				info.offset += NEWLINE.length;
				info.flags |= PREPENDS_NEWLINE;
			} else {
				info.flags &= ~PREPENDS_NEWLINE;
			}

			const oldContent1 = oldContent.slice(oldIndex, oldIndex + length);
			content += oldContent1;
			offset += length;
			oldIndex += length;
			hasNewline = oldContent1.endsWith(NEWLINE);
		} else {
			// The node hasn’t been seen before.
			let appendsNewline = false;
			if (node.nodeType === Node.TEXT_NODE) {
				const content1 = (node as Text).data;
				content += content1;
				offset += content1.length;
				hasNewline = content1.endsWith(NEWLINE);
			} else if ((node as Element).hasAttribute("data-content")) {
				const content1 = (node as Element).getAttribute("data-content") || "";
				content += content1;
				offset += content1.length;
				hasNewline = content1.endsWith(NEWLINE);
			} else if (!hasNewline && isBlocklikeElement(node)) {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
				appendsNewline = true;
			} else if (node.nodeName === "BR") {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}

			info.length = offset - info.offset;
			info.flags |= IS_VALID;
			info.flags = appendsNewline
				? info.flags | APPENDS_NEWLINE
				: info.flags & ~APPENDS_NEWLINE;
		}

		if ((node = walker.nextSibling())) {
			descending = true;
			// getNodeInfo
			info = cache.get(node)!;
			if (info === undefined) {
				info = {flags: 0, offset, length: 0};
				cache.set(node, info);
			} else {
				const oldOffset = oldIndex - relativeOldIndex;
				if (info.offset > oldOffset) {
					// deletion detected
					oldIndex += info.offset - oldOffset;
				} else if (info.offset < oldOffset) {
					// This should never happen
					throw new Error("Invalid state");
				}

				info.offset = offset;
			}
		} else {
			descending = false;
			if (walker.currentNode !== root) {
				if (!stack.length) {
					throw new Error("Stack is empty");
				}

				({relativeOldIndex, info} = stack.pop()!);
				offset = info.offset + offset;
				node = walker.parentNode();
			}
		}
	}

	return content;
}

function isBlocklikeElement(node: Node): node is Element {
	return (
		node.nodeType === Node.ELEMENT_NODE && BLOCKLIKE_ELEMENTS.has(node.nodeName)
	);
}

function invalidate(
	root: Element,
	cache: NodeInfoCache,
	records: Array<MutationRecord>,
): boolean {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		// We make sure all added and removed nodes are cleared from the cache just
		// in case of any MutationObserver weirdness.
		for (let j = 0; j < record.addedNodes.length; j++) {
			clear(record.addedNodes[j], cache);
		}

		for (let j = 0; j < record.removedNodes.length; j++) {
			clear(record.removedNodes[j], cache);
		}

		let node = record.target;
		if (node === root) {
			invalidated = true;
			continue;
		} else if (!root.contains(node)) {
			clear(node, cache);
			continue;
		}

		for (; node !== root; node = node.parentNode!) {
			if (
				!cache.has(node) ||
				(node !== record.target &&
					node.nodeType === Node.ELEMENT_NODE &&
					(node as Element).hasAttribute("data-content"))
			) {
				break;
			}

			const info = cache.get(node);
			if (info) {
				info.flags &= ~IS_VALID;
			}

			invalidated = true;
		}
	}

	if (invalidated) {
		const info = cache.get(root);
		if (info) {
			info.flags &= ~IS_VALID;
		}
	} else if (!cache.get(root)) {
		return true;
	}

	return invalidated;
}

/**
 * For a given parent node and node info cache, clear info for the node and all
 * child nodes from the cache.
 */
function clear(parent: Node, cache: NodeInfoCache): void {
	const walker = document.createTreeWalker(
		parent,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (
		let node: Node | null = parent;
		node !== null;
		node = walker.nextNode()
	) {
		cache.delete(node);
	}
}

/***********************/
/*** Selection Logic ***/
/***********************/
export type SelectionDirection = "forward" | "backward" | "none";

/**
 * Properties which mirror the API provided by HTMLInputElement and
 * HTMLTextAreaElement.
 */
export interface SelectionRange {
	selectionStart: number;
	selectionEnd: number;
	selectionDirection: SelectionDirection;
}

/**
 * Finds the string index of a node and offset pair provided by a browser API
 * like window.getSelection() for a given root and cache.
 */
function indexAt(
	root: Element,
	cache: NodeInfoCache,
	node: Node | null,
	offset: number,
): number {
	if (node == null || !root.contains(node)) {
		return -1;
	}

	if (!cache.has(node)) {
		// If the node is not found in the cache but is contained in the root,
		// then it is probably the child of an element with a data-content
		// attribute.
		// TODO: Maybe a non-zero offset should put the index at the end of
		// the data-content node.
		offset = 0;
		while (!cache.has(node)) {
			node = node.parentNode!;
		}
	}

	let index: number;
	if (node.nodeType === Node.TEXT_NODE) {
		const info = cache.get(node)!;
		index = offset + info.offset;
		node = node.parentNode!;
	} else {
		if (offset <= 0) {
			index = 0;
		} else if (offset >= node.childNodes.length) {
			const info = cache.get(node)!;
			index = info.length;
			if (info.flags & APPENDS_NEWLINE) {
				index -= NEWLINE.length;
			}
		} else {
			let child: Node | null = node.childNodes[offset];
			while (child !== null && !cache.has(child)) {
				child = child.previousSibling;
			}

			if (child === null) {
				index = 0;
			} else {
				node = child;
				const info = cache.get(node)!;
				// If the offset references an element which prepends a newline
				// ("hello<div>world</div>"), we have to start from -1 because the
				// element’s info.offset will not account for the newline.
				index = info.flags & PREPENDS_NEWLINE ? -1 : 0;
			}
		}
	}

	for (; node !== root; node = node.parentNode!) {
		const info = cache.get(node)!;
		index += info.offset;
	}

	return index;
}

/**
 * Finds the node and offset pair to use with browser APIs like
 * selection.collapse() from a given string index.
 */
function nodeOffsetAt(
	root: Element,
	cache: NodeInfoCache,
	index: number,
): [Node | null, number] {
	const [node, offset] = findNodeOffset(root, cache, index);
	if (node && node.nodeName === "BR") {
		// Different browsers can have trouble when calling `selection.collapse()`
		// with a BR element, so we try to avoid returning them from this function.
		return nodeOffsetFromChild(node);
	}

	return [node, offset];
}

function findNodeOffset(
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

	for (let node: Node | null = root; node !== null; ) {
		const info = cache.get(node);
		if (info == null) {
			return nodeOffsetFromChild(node, index > 0);
		} else if (info.flags & PREPENDS_NEWLINE) {
			index -= NEWLINE.length;
		}

		if (index < 0) {
			// This branch should only run when an element prepends an newline
			const previousSibling = walker.previousSibling();
			if (!previousSibling) {
				throw new Error("Invalid state");
			}

			return [previousSibling, getNodeLength(previousSibling)];
		} else if (
			index === info.length &&
			(node.nodeType === Node.TEXT_NODE ||
				(node as Element).hasAttribute("data-content"))
		) {
			if (node.nodeType === Node.TEXT_NODE) {
				return [node, (node as Text).data.length];
			} else {
				return nodeOffsetFromChild(node, true);
			}
		} else if (index >= info.length) {
			index -= info.length;
			node = walker.nextSibling();
		} else {
			if (
				node.nodeType === Node.ELEMENT_NODE &&
				(node as Element).hasAttribute("data-content")
			) {
				return nodeOffsetFromChild(node, index > 0);
			}

			const firstChild = walker.firstChild();
			if (firstChild === null) {
				const offset =
					node.nodeType === Node.TEXT_NODE ? index : index > 0 ? 1 : 0;
				return [node, offset];
			} else {
				node = firstChild;
			}
		}
	}

	const node = walker.currentNode;
	return [node, getNodeLength(node)];
}

function getNodeLength(node: Node) {
	if (node.nodeType === Node.TEXT_NODE) {
		return (node as Text).data.length;
	}

	return node.childNodes.length;
}

function nodeOffsetFromChild(
	node: Node,
	after: boolean = false,
): [Node | null, number] {
	const parentNode = node.parentNode;
	if (parentNode === null) {
		return [null, 0];
	}

	let offset = Array.from(parentNode.childNodes).indexOf(node as ChildNode);
	if (after) {
		offset++;
	}

	return [parentNode, offset];
}

function getSelectionRange(
	root: Element,
	cache: NodeInfoCache,
): SelectionRange {
	const selection = document.getSelection();
	if (selection == null) {
		return {selectionStart: 0, selectionEnd: 0, selectionDirection: "none"};
	}

	const {
		focusNode,
		focusOffset,
		anchorNode,
		anchorOffset,
		isCollapsed,
	} = selection;
	const focus = indexAt(root, cache, focusNode, focusOffset);
	const anchor = isCollapsed
		? focus
		: indexAt(root, cache, anchorNode, anchorOffset);
	return {
		selectionStart: Math.min(focus, anchor),
		selectionEnd: Math.max(focus, anchor),
		selectionDirection:
			focus === anchor ? "none" : focus < anchor ? "backward" : "forward",
	};
}

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
	// because attempting to the final newline can cause the editable element to
	// lose focus.
	const length = value.replace(/(\r|\n|\r\n)$/, "").length;
	selectionStart = selectionStart || 0;
	selectionEnd = selectionEnd || 0;
	selectionStart = Math.max(0, Math.min(length, selectionStart));
	selectionEnd = Math.max(0, Math.min(length, selectionEnd));
	if (selectionEnd < selectionStart) {
		selectionStart = selectionEnd;
	}

	let focusIndex: number;
	let anchorIndex: number;
	if (selectionDirection === "backward") {
		anchorIndex = selectionEnd;
		focusIndex = selectionStart;
	} else {
		anchorIndex = selectionStart;
		focusIndex = selectionEnd;
	}

	if (focusIndex === anchorIndex) {
		const [node, offset] = nodeOffsetAt(root, cache, focusIndex);
		selection.collapse(node, offset);
	} else {
		const [anchorNode, anchorOffset] = nodeOffsetAt(root, cache, anchorIndex);
		const [focusNode, focusOffset] = nodeOffsetAt(root, cache, focusIndex);
		if (anchorNode === null && focusNode === null) {
			selection.collapse(null);
		} else if (anchorNode === null) {
			selection.collapse(focusNode, focusOffset);
		} else if (focusNode === null) {
			selection.collapse(anchorNode, anchorOffset);
		} else {
			// TODO: This is not a method in IE. Do we care???
			selection.setBaseAndExtent(
				anchorNode,
				anchorOffset,
				focusNode,
				focusOffset,
			);
		}
	}
}
