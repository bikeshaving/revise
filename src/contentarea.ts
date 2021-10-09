/// <reference lib="dom" />
import {Edit} from "./edit";

export interface ContentEventDetail {
	edit: Edit;
	source: string | null;
	// TODO: add information about changed ranges
}

export interface ContentEventInit extends CustomEventInit<ContentEventDetail> {}

export class ContentEvent extends CustomEvent<ContentEventDetail> {
	constructor(typeArg: string, eventInit: ContentEventInit) {
		// Maybe we should do some runtime eventInit validation.
		super(typeArg, {bubbles: true, ...eventInit});
	}
}

/** Whether the node’s info is up to date. */
const IS_VALID = 1 << 0;
/** Whether the node is responsible for the newline before it. */
const PREPENDS_NEWLINE = 1 << 1;
/** Whether the node is responsible for the newline after it. */
const APPENDS_NEWLINE = 1 << 2;

class NodeInfo {
	/** A bitmask (see flags above) */
	flags: number;
	/** The string length of this node’s contents. */
	size: number;
	/** The start of this node’s contents relative to the start of the parent. */
	offset: number;

	constructor(offset: number) {
		this.flags = 0;
		this.size = 0;
		this.offset = offset;
	}
}

type NodeInfoCache = Map<Node, NodeInfo>;

/********************************************/
/*** ContentAreaElement symbol properties ***/
/********************************************/
const $slot = Symbol.for("revise$slot");
const $cache = Symbol.for("revise$cache");
const $value = Symbol.for("revise$value");
const $observer = Symbol.for("revise$observer");
const $selectionStart = Symbol.for("revise$selectionStart");
const $onselectionchange = Symbol.for("revise$onselectionchange");

const css = `:host {
	display: contents;
	white-space: pre-wrap;
	white-space: break-spaces;
	overflow-wrap: break-word;
}`;

export class ContentAreaElement extends HTMLElement implements SelectionRange {
	[$slot]: HTMLSlotElement;
	[$cache]: NodeInfoCache;
	[$value]: string;
	[$observer]: MutationObserver;
	// For the most part, we compute selection info on the fly, because of weird
	// race conditions. However, we need to retain the previous selectionStart
	// when building edits so that we can disambiguate edits to runs of
	// characters. See the Edit.diff call below.
	[$selectionStart]: number;
	[$onselectionchange]: () => void;
	constructor() {
		super();
		{
			// Creating the shadow DOM.
			const slot = document.createElement("slot");
			const shadow = this.attachShadow({mode: "closed"});
			const style = document.createElement("style");
			style.textContent = css;
			shadow.appendChild(style);
			slot.contentEditable = this.contentEditable;
			shadow.appendChild(slot);
			this[$slot] = slot;
		}

		this[$cache] = new Map();
		this[$value] = "";
		this[$observer] = new MutationObserver((records) => {
			validate(this, null, records);
		});
		this[$selectionStart] = 0;
		this[$onselectionchange] = () => {
			validate(this);
			this[$selectionStart] = getSelectionRange(
				this,
				this[$cache],
			).selectionStart;
		};
	}

	/******************************/
	/*** Custom Element methods ***/
	/******************************/
	static get observedAttributes(): Array<string> {
		return ["contenteditable"];
	}

	connectedCallback() {
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

		this[$value] = getValue(this, this[$cache], "");
		this[$selectionStart] = getSelectionRange(
			this,
			this[$cache],
		).selectionStart;
		document.addEventListener(
			"selectionchange",
			this[$onselectionchange],
			// We use capture in an attempt to run before other event listeners.
			true,
		);
	}

	disconnectedCallback() {
		this[$cache].clear();
		this[$value] = "";
		this[$observer].disconnect();
		// JSDOM-based environments like Jest will make the global document null
		// before calling the disconnectedCallback for some reason.
		if (document) {
			document.removeEventListener(
				"selectionchange",
				this[$onselectionchange],
				true,
			);
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
		validate(this);
		return this[$value];
	}

	get selectionStart(): number {
		validate(this);
		return getSelectionRange(this, this[$cache]).selectionStart;
	}

	set selectionStart(selectionStart: number) {
		validate(this);

		const selectionRange = getSelectionRange(this, this[$cache]);
		setSelectionRange(
			this,
			this[$cache],
			selectionStart,
			selectionRange.selectionEnd,
			selectionRange.selectionDirection,
		);
	}

	get selectionEnd(): number {
		validate(this);
		return getSelectionRange(this, this[$cache]).selectionEnd;
	}

	set selectionEnd(selectionEnd: number) {
		validate(this);
		const selectionRange = getSelectionRange(this, this[$cache]);
		setSelectionRange(
			this,
			this[$cache],
			selectionRange.selectionStart,
			selectionEnd,
			selectionRange.selectionDirection,
		);
	}

	get selectionDirection(): SelectionDirection {
		validate(this);
		return getSelectionRange(this, this[$cache]).selectionDirection;
	}

	set selectionDirection(selectionDirection: SelectionDirection) {
		validate(this);
		const selectionRange = getSelectionRange(this, this[$cache]);
		setSelectionRange(
			this,
			this[$cache],
			selectionRange.selectionStart,
			selectionRange.selectionEnd,
			selectionDirection,
		);
	}

	getSelectionRange(): SelectionRange {
		validate(this);
		return getSelectionRange(this, this[$cache]);
	}

	setSelectionRange(
		selectionStart: number,
		selectionEnd: number,
		selectionDirection: SelectionDirection = "none",
	): void {
		validate(this);
		setSelectionRange(
			this,
			this[$cache],
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	indexAt(node: Node | null, offset: number): number {
		validate(this);
		const cache = this[$cache];
		return indexAt(this, cache, node, offset);
	}

	nodeOffsetAt(index: number): [Node | null, number] {
		validate(this);
		const cache = this[$cache];
		return nodeOffsetAt(this, cache, index);
	}

	source(source: string): boolean {
		return validate(this, source, this[$observer].takeRecords());
	}
}

// TODO: custom newlines?
const NEWLINE = "\n";

// TODO: Try using getComputedStyle
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
	source: string | null = null,
	records?: Array<MutationRecord> | undefined,
): boolean {
	const cache = root[$cache];
	// We use the existence of records to determine whether
	// contentchange events should be fired synchronously.
	let delay = false;
	if (records === undefined) {
		delay = true;
		records = root[$observer].takeRecords();
	}

	if (!invalidate(root, cache, records)) {
		return false;
	}

	const oldValue = root[$value];
	const oldSelectionStart = root[$selectionStart];
	const value = (root[$value] = getValue(root, cache, oldValue));
	const selectionStart = getSelectionRange(root, cache).selectionStart;

	const hint = Math.min(oldSelectionStart, selectionStart);
	// TODO: This call is expensive. If we have getValue return an edit instead
	// of a string, we might be able to save a lot in CPU time.
	const edit = Edit.diff(oldValue, value, hint);
	const ev = new ContentEvent("contentchange", {detail: {edit, source}});
	if (delay) {
		Promise.resolve().then(() => root.dispatchEvent(ev));
	} else {
		root.dispatchEvent(ev);
	}

	return true;
}

function invalidate(
	root: ContentAreaElement,
	cache: NodeInfoCache,
	records: Array<MutationRecord>,
): boolean {
	if (!cache.get(root)) {
		return true;
	}

	let invalid = false;
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

		// TODO: invalidate data-content nodes correctly.
		let node = record.target;
		if (node === root) {
			invalid = true;
			continue;
		} else if (!root.contains(node)) {
			clear(node, cache);
			continue;
		}

		for (; node !== root; node = node.parentNode!) {
			if (!cache.has(node)) {
				break;
			}

			const info = cache.get(node);
			if (info) {
				info.flags &= ~IS_VALID;
			}

			invalid = true;
		}
	}

	if (invalid) {
		const info = cache.get(root)!;
		info.flags &= ~IS_VALID;
	}

	return invalid;
}

// This is the single most complicated function in the library!!!
/**
 * This function both returns the content of the root (always a content-area
 * element, and populates the cache with info about the contents of nodes for
 * future reads.
 * @param root - The root element (usually a content-area element)
 * @param cache - The nodeInfo cache associated with the root
 * @param oldContent - The previous content of the root.
 */
function getValue(
	root: Element,
	cache: NodeInfoCache,
	oldContent: string,
): string {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	// TODO: It might be faster to construct and return a edit rather than
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
		info = new NodeInfo(offset);
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
				info = new NodeInfo(offset);
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
			const length = info.size;
			if (oldIndex + info.size > oldContent.length) {
				// This should never happen
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

			info.size = offset - info.offset;
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
				info = new NodeInfo(offset);
				cache.set(node, info);
			} else {
				const oldOffset = oldIndex - relativeOldIndex;
				if (info.offset > oldOffset) {
					// deletion detected
					oldIndex += info.offset - oldOffset;
				} else if (info.offset < oldOffset) {
					// This should never happen
					throw new Error("Offset is before old offset");
				}

				info.offset = offset;
			}
		} else {
			descending = false;
			if (walker.currentNode !== root) {
				if (!stack.length) {
					// This should never happen
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
			index = info.size;
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
				// This should never happen
				throw new Error("Previous sibling missing");
			}

			return [previousSibling, getNodeLength(previousSibling)];
		} else if (index === info.size && node.nodeType === Node.TEXT_NODE) {
			return [node, (node as Text).data.length];
		} else if (index >= info.size) {
			index -= info.size;
			const nextSibling = walker.nextSibling();
			if (nextSibling === null) {
				// This branch seems necessary mainly when working with data-content
				// nodes.
				if (node === root) {
					return [node, getNodeLength(node)];
				}

				return nodeOffsetFromChild(walker.currentNode, true);
			}

			node = nextSibling;
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
	const selection = window.getSelection();
	if (!selection) {
		return {selectionStart: 0, selectionEnd: 0, selectionDirection: "none"};
	}

	const {
		focusNode,
		focusOffset,
		anchorNode,
		anchorOffset,
		isCollapsed,
	} = selection;
	const focus = Math.max(0, indexAt(root, cache, focusNode, focusOffset));
	const anchor = isCollapsed
		? focus
		: Math.max(0, indexAt(root, cache, anchorNode, anchorOffset));
	return {
		selectionStart: Math.min(focus, anchor),
		selectionEnd: Math.max(focus, anchor),
		selectionDirection:
			focus < anchor ? "backward" : focus > anchor ? "forward" : "none",
	};
}

function setSelectionRange(
	root: Element,
	cache: NodeInfoCache,
	selectionStart: number,
	selectionEnd: number,
	selectionDirection: SelectionDirection,
): void {
	const selection = window.getSelection();
	if (!selection) {
		return;
	}

	selectionStart = Math.max(0, selectionStart || 0);
	selectionEnd = Math.max(0, selectionEnd || 0);
	if (selectionEnd < selectionStart) {
		selectionStart = selectionEnd;
	}

	const [focusIndex, anchorIndex] =
		selectionDirection === "backward"
			? [selectionStart, selectionEnd]
			: [selectionEnd, selectionStart];

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
			// This is not a method in IE. We don’t care.
			selection.setBaseAndExtent(
				anchorNode,
				anchorOffset,
				focusNode,
				focusOffset,
			);
		}
	}
}
