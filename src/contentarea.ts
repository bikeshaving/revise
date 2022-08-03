/// <reference lib="dom" />
import {Edit} from "./edit.js";

export interface ContentEventDetail {
	edit: Edit;
	source: string | null;
}

export interface ContentEventInit extends CustomEventInit<ContentEventDetail> {}

export class ContentEvent extends CustomEvent<ContentEventDetail> {
	constructor(typeArg: string, eventInit: ContentEventInit) {
		// Maybe we should do some runtime eventInit validation.
		super(typeArg, {bubbles: true, ...eventInit});
	}
}

// NodeInfo flags
/** Whether the node is old. */
const IS_OLD = 1 << 0;
/** Whether the node’s info is up to date. */
const IS_CLEAN = 1 << 1;
/** Whether the node is responsible for the newline before it. */
const PREPENDS_NEWLINE = 1 << 2;
/** Whether the node is responsible for the newline after it. */
const APPENDS_NEWLINE = 1 << 3;

class NodeInfo {
	/** A bitmask (see flags above) */
	declare flags: number;
	/** The string length of this node’s contents. */
	declare length: number;
	/** The start of this node’s contents relative to the start of the parent. */
	declare offset: number;

	constructor(offset: number) {
		this.flags = 0;
		this.length = 0;
		this.offset = offset;
	}
}

type NodeInfoCache = Map<Node, NodeInfo>;

/********************************************/
/*** ContentAreaElement symbol properties ***/
/********************************************/
const $cache = Symbol("ContentArea.cache");
const $value = Symbol("ContentArea.value");
const $observer = Symbol("ContentArea.observer");
const $startNodeOffset = Symbol("ContentArea.startNodeOffset");
const $onselectionchange = Symbol("ContentArea.onselectionchange");

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

export class ContentAreaElement extends HTMLElement implements SelectionRange {
	declare [$cache]: NodeInfoCache;
	declare [$value]: string;
	declare [$observer]: MutationObserver;
	declare [$startNodeOffset]: [Node | null, number];
	declare [$onselectionchange]: () => void;
	constructor() {
		super();

		this[$cache] = new Map();
		this[$value] = "";
		this[$observer] = new MutationObserver((records) => {
			validate(this, null, records);
		});
		this[$onselectionchange] = () => {
			this[$startNodeOffset] = getStartNodeOffset();
		};
	}

	/******************************/
	/*** Custom Element methods ***/
	/******************************/
	connectedCallback() {
		this[$observer].observe(this, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [
				"data-content",
				// TODO: implement these attributes
				"data-contentbefore",
				"data-contentafter",
			],
			attributeOldValue: true,
			characterData: true,
			characterDataOldValue: true,
		});

		const edit = getEdit(this, this[$cache], "");
		this[$value] = edit.apply("");
		this[$startNodeOffset] = getStartNodeOffset();
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

function getStartNodeOffset(): [Node | null, number] {
	const selection = document.getSelection();
	if (selection && selection.rangeCount) {
		const range = selection.getRangeAt(0);
		return [range.startContainer, range.startOffset];
	}

	return [null, 0];
}

/**
 * Should be pre-emptively called before we read from the cache. Dispatches
 * "contentchange" events, and makes sure the cache is up to date.
 *
 * @returns whether there was a change detected
 */
function validate(
	root: ContentAreaElement,
	source: string | null = null,
	records?: Array<MutationRecord> | undefined,
): boolean {
	const cache = root[$cache];
	if (!invalidate(root, cache, records || root[$observer].takeRecords())) {
		return false;
	}

	const oldValue = root[$value];
	const edit = getEdit(root, cache, oldValue);
	root[$value] = edit.apply(oldValue);
	const ev = new ContentEvent("contentchange", {detail: {edit, source}});
	// We use the existence of records to determine whether contentchange events
	// should be fired synchronously.
	if (records === undefined) {
		Promise.resolve().then(() => {
			root.dispatchEvent(ev);
		});
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

			const nodeInfo = cache.get(node);
			if (nodeInfo) {
				nodeInfo.flags &= ~IS_CLEAN;
			}

			invalid = true;
		}
	}

	if (invalid) {
		const nodeInfo = cache.get(root)!;
		nodeInfo.flags &= ~IS_CLEAN;
	}

	return invalid;
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

/**
 * This function both returns an edit which represents changes to the
 * ContentAreaElement, and populates the cache with info about the contents of
 * nodes for future reads.
 *
 * @param root - The root element
 * @param cache - The NodeInfo cache associated with the root
 * @param oldValue - The previous content of the root.
 */
function getEdit(
	root: ContentAreaElement,
	cache: NodeInfoCache,
	oldValue: string,
): Edit {
	const builder = Edit.builder(oldValue);
	const stack: Array<{nodeInfo: NodeInfo; oldIndexRelative: number}> = [];
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (
		let node: Node = root,
			// The current offset relative to the current node
			offset = 0,
			// The index into the old string
			oldIndex = 0,
			// The index into the old string of the current node
			oldIndexRelative = 0,
			// Whether or not the previous element ends with a newline
			hasNewline = false,
			descending = true;
		;
		node = walker.currentNode
	) {
		let nodeInfo: NodeInfo;
		if (descending) {
			// PRE-ORDER LOGIC
			nodeInfo = cache.get(node)!;
			if (nodeInfo === undefined) {
				cache.set(node, (nodeInfo = new NodeInfo(offset)));
			} else {
				const expectedIndex = oldIndex - oldIndexRelative;
				if (nodeInfo.offset > expectedIndex) {
					// deletion detected
					builder.delete(nodeInfo.offset - expectedIndex);
					oldIndex += nodeInfo.offset - expectedIndex;
				} else if (nodeInfo.offset < expectedIndex) {
					// This should never happen
					throw new Error("cache offset error");
				}

				nodeInfo.offset = offset;
			}

			// block elements prepend a newline
			if (offset && !hasNewline && isBlocklikeElement(node)) {
				// TODO: retain if element is old
				builder.insert(NEWLINE);
				hasNewline = true;
				offset += NEWLINE.length;

				// TODO: We advance the nodeInfo offset. Is that sound logic? I can’t tell.
				nodeInfo.offset += NEWLINE.length;
				nodeInfo.flags |= PREPENDS_NEWLINE;
			} else {
				nodeInfo.flags &= ~PREPENDS_NEWLINE;
			}

			descending = false;
			if (nodeInfo.flags & IS_CLEAN) {
				// The node and its children are unchanged.
				const length = nodeInfo.length;
				if (oldIndex + nodeInfo.length > oldValue.length) {
					// This should never happen
					throw new Error("cache length error");
				}

				builder.retain(length);
				const oldValue1 = oldValue.slice(oldIndex, oldIndex + length);
				offset += length;
				oldIndex += length;
				if (length) {
					hasNewline = oldValue1.endsWith(NEWLINE);
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				const text = (node as Text).data;
				if (nodeInfo.flags & IS_OLD) {
					const nodeOffset = getStartNodeOffset();
					const oldText = oldValue.slice(oldIndex, oldIndex + nodeInfo.length);
					const oldStartOffset =
						root[$startNodeOffset][0] === node ? root[$startNodeOffset][1] : -1;
					const startOffset = nodeOffset[0] === node ? nodeOffset[1] : -1;
					const hint = Math.min(oldStartOffset, startOffset);
					if (hint > -1) {
						const edit = Edit.diff(oldText, text, hint);
						builder.concat(edit);
						oldIndex += nodeInfo.length;
					} else {
						builder.insert(text);
					}
				} else {
					builder.insert(text);
				}

				offset += text.length;
				if (text.length) {
					hasNewline = text.endsWith(NEWLINE);
				}
			} else if ((node as Element).hasAttribute("data-content")) {
				const text = (node as Element).getAttribute("data-content") || "";
				builder.insert(text);
				offset += text.length;
				if (text.length) {
					hasNewline = text.endsWith(NEWLINE);
				}
			} else if (node.nodeName === "BR") {
				builder.insert(NEWLINE);
				offset += NEWLINE.length;
				hasNewline = true;
			} else {
				descending = !!walker.firstChild();
				if (descending) {
					stack.push({nodeInfo, oldIndexRelative});
					offset = 0;
					oldIndexRelative = oldIndex;
				}
			}
		} else {
			if (!stack.length) {
				// This should never happen
				throw new Error("Stack is empty");
			}

			({nodeInfo, oldIndexRelative} = stack.pop()!);
			offset = nodeInfo.offset + offset;
		}

		if (!descending) {
			// POST-ORDER LOGIC
			// TODO: If a node is clean, does this mean the APPENDS_NEWLINE flag is
			// constant? It seems like the only edge case is an empty block
			// element...
			if (!(nodeInfo.flags & IS_CLEAN)) {
				// block elements append a newline
				if (!hasNewline && isBlocklikeElement(node)) {
					// TODO: check inserts and retain
					builder.insert(NEWLINE);
					offset += NEWLINE.length;
					hasNewline = true;

					nodeInfo.flags |= APPENDS_NEWLINE;
				} else {
					nodeInfo.flags &= ~APPENDS_NEWLINE;
				}

				nodeInfo.length = offset - nodeInfo.offset;
				nodeInfo.flags |= IS_CLEAN;
			}

			nodeInfo.flags |= IS_OLD;

			descending = !!walker.nextSibling();
			if (!descending) {
				if (walker.currentNode === root) {
					break;
				}

				walker.parentNode();
			}
		}
	}

	// Make sure the rest of the old value is deleted
	builder.delete(Infinity);
	return builder.build();
}

function isBlocklikeElement(node: Node): node is Element {
	return (
		node.nodeType === Node.ELEMENT_NODE && BLOCKLIKE_ELEMENTS.has(node.nodeName)
	);
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
 * like document.getSelection() for a given root and cache.
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
		// TODO: Maybe a non-zero offset should put the index at the end of the
		// data-content node.
		offset = 0;
		while (!cache.has(node)) {
			node = node.parentNode!;
		}
	}

	let index: number;
	if (node.nodeType === Node.TEXT_NODE) {
		const nodeInfo = cache.get(node)!;
		index = offset + nodeInfo.offset;
		node = node.parentNode!;
	} else {
		if (offset <= 0) {
			index = 0;
		} else if (offset >= node.childNodes.length) {
			const nodeInfo = cache.get(node)!;
			index =
				nodeInfo.flags & APPENDS_NEWLINE
					? nodeInfo.length - NEWLINE.length
					: nodeInfo.length;
		} else {
			let child: Node | null = node.childNodes[offset];
			while (child !== null && !cache.has(child)) {
				child = child.previousSibling;
			}

			if (child === null) {
				index = 0;
			} else {
				node = child;
				const nodeInfo = cache.get(node)!;
				// If the offset references an element which prepends a newline
				// ("hello<div>world</div>"), we have to start from -1 because the
				// element’s info.offset will not account for the newline.
				index = nodeInfo.flags & PREPENDS_NEWLINE ? -1 : 0;
			}
		}
	}

	for (; node !== root; node = node.parentNode!) {
		const nodeInfo = cache.get(node)!;
		index += nodeInfo.offset;
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
		// Some browsers seem to have trouble when calling `selection.collapse()`
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
		const nodeInfo = cache.get(node);
		if (nodeInfo == null) {
			return nodeOffsetFromChild(node, index > 0);
		} else if (nodeInfo.flags & PREPENDS_NEWLINE) {
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
		} else if (index === nodeInfo.length && node.nodeType === Node.TEXT_NODE) {
			return [node, (node as Text).data.length];
		} else if (index >= nodeInfo.length) {
			index -= nodeInfo.length;
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
	const selection = document.getSelection();
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
	const selection = document.getSelection();
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
			// This method is not implemented in IE.
			selection.setBaseAndExtent(
				anchorNode,
				anchorOffset,
				focusNode,
				focusOffset,
			);
		}
	}
}
