/// <reference lib="dom" />
import {Edit} from "./edit.js";

// TODO: custom newlines?
const NEWLINE = "\n";

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
/********************************************/
/*** ContentAreaElement private property symbols ***/
/********************************************/
const $cache = Symbol.for("ContentAreaElement.cache");
const $value = Symbol.for("ContentAreaElement.value");
const $observer = Symbol.for("ContentAreaElement.observer");
const $startNodeOffset = Symbol.for("ContentAreaElement.startNodeOffset");
const $onselectionchange = Symbol.for("ContentAreaElement.onselectionchange");

export class ContentAreaElement extends HTMLElement {
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
			validate(this, records);
		});

		this.addEventListener("input", () => {
			// This is necessary for Safari bugs where edits which cause >40ms of
			// execution cause strange logical bugs which mess with the selection.
			validate(this);
		});

		this[$onselectionchange] = () => {
			// We keep track of the starting node offset pair to accurately diff
			// edits to text nodes.
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
			characterData: true,
			attributes: true,
			attributeFilter: [
				"data-content",
				// TODO: implement these attributes
				//"data-contentbefore",
				//"data-contentafter",
			],
		});

		validate(this);
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
		// JSDOM-based environments like Jest sometimes make the global document
		// null before calling the disconnectedCallback for some reason.
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
		return getSelectionRange(this, this[$cache]).start;
	}

	set selectionStart(start: number) {
		validate(this);

		const {end, direction} = getSelectionRange(this, this[$cache]);
		setSelectionRange(this, this[$cache], {start, end, direction});
	}

	get selectionEnd(): number {
		validate(this);
		return getSelectionRange(this, this[$cache]).end;
	}

	set selectionEnd(end: number) {
		validate(this);
		const {start, direction} = getSelectionRange(this, this[$cache]);
		setSelectionRange(this, this[$cache], {start, end, direction});
	}

	get selectionDirection(): SelectionDirection {
		validate(this);
		return getSelectionRange(this, this[$cache]).direction;
	}

	set selectionDirection(direction: SelectionDirection) {
		validate(this);
		const {start, end} = getSelectionRange(this, this[$cache]);
		setSelectionRange(this, this[$cache], {start, end, direction});
	}

	setSelectionRange(
		start: number,
		end: number,
		direction: SelectionDirection = "none",
	): void {
		validate(this);
		setSelectionRange(this, this[$cache], {start, end, direction});
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
		return validate(this, this[$observer].takeRecords(), source);
	}
}

/*** NodeInfo.flags ***/
/** Whether the node is old. */
const IS_OLD = 1 << 0;
/** Whether the node’s info is still up-to-date. */
const IS_VALID = 1 << 1;
/** Whether the node has a styling of type display: block or similar. */
const IS_BLOCKLIKE = 1 << 2;
/** Whether the node is responsible for the newline before it. */
const PREPENDS_NEWLINE = 1 << 3;
/** Whether the node is responsible for the newline after it. */
const APPENDS_NEWLINE = 1 << 4;

/** Data associated with the child nodes of a ContentAreaElement. */
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

/** Each ContentAreaElement is associated with its own private cache. */
type NodeInfoCache = Map<Node, NodeInfo>;

/**
 * Should be called before calling any ContentAreaElement methods.
 *
 * This function ensures the cache is up to date.
 *
 * Dispatches "contentchange" events.
 *
 * @returns whether a change was detected
 */
function validate(
	_this: ContentAreaElement,
	records: Array<MutationRecord> = _this[$observer].takeRecords(),
	source: string | null = null,
): boolean {
	if (typeof _this !== "object" || _this[$cache] == null) {
		throw new TypeError("this is not a ContentAreaElement");
	}

	const cache = _this[$cache];
	if (!invalidate(_this, cache, records)) {
		return false;
	}

	const oldValue = _this[$value];
	const edit = diff(_this, cache, oldValue);
	_this[$value] = edit.apply(oldValue);
	const ev = new ContentEvent("contentchange", {detail: {edit, source}});
	_this.dispatchEvent(ev);
	return true;
}

function invalidate(
	_this: ContentAreaElement,
	cache: NodeInfoCache,
	records: Array<MutationRecord>,
): boolean {
	if (!cache.get(_this)) {
		// the root ContentAreaElement will never be cleared from the cache.
		return true;
	}

	let invalid = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		// We make sure all added and removed nodes are cleared from the cache in
		// case of any MutationObserver weirdness.
		for (let j = 0; j < record.addedNodes.length; j++) {
			clear(record.addedNodes[j], cache);
		}

		for (let j = 0; j < record.removedNodes.length; j++) {
			clear(record.removedNodes[j], cache);
		}

		let node = record.target;
		if (node === _this) {
			invalid = true;
			continue;
		} else if (!_this.contains(node)) {
			clear(node, cache);
			continue;
		}

		for (; node !== _this; node = node.parentNode!) {
			if (!cache.has(node)) {
				break;
			}

			const nodeInfo = cache.get(node);
			if (nodeInfo) {
				nodeInfo.flags &= ~IS_VALID;
			}

			invalid = true;
		}
	}

	if (invalid) {
		const nodeInfo = cache.get(_this)!;
		nodeInfo.flags &= ~IS_VALID;
	}

	return invalid;
}

/**
 * For a given parent node and node info cache, clear the info for the node and
 * all of its child nodes from the cache.
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

// THIS IS THE MOST COMPLICATED FUNCTION IN THE LIBRARY!
/**
 * This function both returns an edit which represents changes to the
 * ContentAreaElement, and populates the cache with info about nodes for future
 * reads.
 */
function diff(
	_this: ContentAreaElement,
	cache: NodeInfoCache,
	oldValue: string,
): Edit {
	const builder = Edit.builder(oldValue);
	const stack: Array<{nodeInfo: NodeInfo; oldIndexRelative: number}> = [];
	const walker = document.createTreeWalker(
		_this,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	let nodeInfo: NodeInfo;
	for (
		let node: Node = _this,
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
		if (descending) {
			// PRE-ORDER LOGIC
			nodeInfo = cache.get(node)!;
			if (nodeInfo === undefined) {
				cache.set(node, (nodeInfo = new NodeInfo(offset)));
				if (isBlocklikeElement(node)) {
					nodeInfo.flags |= IS_BLOCKLIKE;
				}
			} else {
				const expected = oldIndex - oldIndexRelative;
				if (nodeInfo.offset < expected) {
					// This should never happen
					throw new Error("cache offset error");
				} else if (nodeInfo.offset > expected) {
					// deletion detected
					const length = nodeInfo.offset - expected;
					builder.delete(length);
					oldIndex += length;
				}

				nodeInfo.offset = offset;
			}

			// block elements prepend a newline when they appear after text or inline
			// elements.
			if (offset && !hasNewline && nodeInfo.flags & IS_BLOCKLIKE) {
				if (nodeInfo.flags & PREPENDS_NEWLINE) {
					builder.retain(NEWLINE.length);
					oldIndex += NEWLINE.length;
					offset += NEWLINE.length;
				} else {
					builder.insert(NEWLINE);
					offset += NEWLINE.length;
					hasNewline = true;
				}

				nodeInfo.flags |= PREPENDS_NEWLINE;
			} else {
				if (nodeInfo.flags & PREPENDS_NEWLINE) {
					builder.delete(NEWLINE.length);
					oldIndex += NEWLINE.length;
				}

				nodeInfo.flags &= ~PREPENDS_NEWLINE;
			}

			descending = false;
			if (nodeInfo.flags & IS_VALID) {
				// The node and its children are unchanged.
				const length = nodeInfo.length;
				if (oldIndex + nodeInfo.length > oldValue.length) {
					// This should never happen
					throw new Error("cache length error");
				}

				if (length) {
					const oldValue1 = oldValue.slice(oldIndex, oldIndex + length);
					hasNewline = oldValue1.endsWith(NEWLINE);
				}

				builder.retain(length);
				oldIndex += length;
				offset += length;
			} else if (node.nodeType === Node.TEXT_NODE) {
				const text = (node as Text).data;
				if (nodeInfo.flags & IS_OLD) {
					const nodeOffset = getStartNodeOffset();
					const oldText = oldValue.slice(oldIndex, oldIndex + nodeInfo.length);
					const oldStartOffset =
						_this[$startNodeOffset][0] === node
							? _this[$startNodeOffset][1]
							: -1;
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

			if (nodeInfo!.flags & PREPENDS_NEWLINE) {
				offset += NEWLINE.length;
			}

			({nodeInfo, oldIndexRelative} = stack.pop()!);
			offset = nodeInfo.offset + offset;
		}

		if (!descending) {
			// POST-ORDER LOGIC
			// TODO: If a node is clean, does this mean the APPENDS_NEWLINE flag is
			// constant? It seems like the only edge case is an empty block
			// element...
			if (!(nodeInfo.flags & IS_VALID)) {
				// block elements append a newline
				if (!hasNewline && nodeInfo.flags & IS_BLOCKLIKE) {
					// TODO: check inserts and retain
					builder.insert(NEWLINE);
					offset += NEWLINE.length;
					hasNewline = true;

					nodeInfo.flags |= APPENDS_NEWLINE;
				} else {
					nodeInfo.flags &= ~APPENDS_NEWLINE;
				}

				nodeInfo.length = offset - nodeInfo.offset;
				nodeInfo.flags |= IS_VALID;
			}

			nodeInfo.flags |= IS_OLD;

			descending = !!walker.nextSibling();
			if (!descending) {
				if (walker.currentNode === _this) {
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

const BLOCKLIKE_DISPLAYS = new Set([
	"block",
	"flex",
	"grid",
	"flow-root",
	"list-item",
	"table",
	"table-row-group",
	"table-header-group",
	"table-footer-group",
	"table-row",
	"table-caption",
]);

function isBlocklikeElement(node: Node): node is Element {
	return (
		node.nodeType === Node.ELEMENT_NODE &&
		BLOCKLIKE_DISPLAYS.has(
			// handle two-value display syntax like `display: block flex`
			getComputedStyle(node as Element).display.split(" ")[0],
		)
	);
}

/***********************/
/*** Selection Logic ***/
/***********************/
function getStartNodeOffset(): [Node | null, number] {
	const selection = document.getSelection();
	if (selection && selection.rangeCount) {
		const range = selection.getRangeAt(0);
		return [range.startContainer, range.startOffset];
	}

	return [null, 0];
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
		// If the node is not found in the cache but is contained in the root, then
		// it is the child of an element with a data-content attribute.
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
		if (nodeInfo.flags & PREPENDS_NEWLINE) {
			index += NEWLINE.length;
		}
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
	if (index < 0) {
		return [null, 0];
	}

	const [node, offset] = findNodeOffset(root, cache, Math.max(0, index));
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
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (let node: Node | null = root; node !== null; ) {
		const nodeInfo = cache.get(node);
		if (nodeInfo == null) {
			return nodeOffsetFromChild(node, index > 0);
		}

		if (nodeInfo.flags & PREPENDS_NEWLINE) {
			index -= 1;
		}

		if (index === nodeInfo.length && node.nodeType === Node.TEXT_NODE) {
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

export type SelectionDirection = "forward" | "backward" | "none";

interface SelectionRange {
	start: number;
	end: number;
	direction: SelectionDirection;
}

function getSelectionRange(
	root: Element,
	cache: NodeInfoCache,
): SelectionRange {
	const selection = document.getSelection();
	if (!selection) {
		return {start: 0, end: 0, direction: "none"};
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
		start: Math.min(focus, anchor),
		end: Math.max(focus, anchor),
		direction:
			focus < anchor ? "backward" : focus > anchor ? "forward" : "none",
	};
}

function setSelectionRange(
	root: Element,
	cache: NodeInfoCache,
	{start, end, direction}: SelectionRange,
): void {
	const selection = document.getSelection();
	if (!selection) {
		return;
	}

	start = Math.max(0, start || 0);
	end = Math.max(0, end || 0);
	if (end < start) {
		start = end;
	}

	// Focus is the end of the selection where the pointer is released.
	const [focus, anchor] =
		direction === "backward" ? [start, end] : [end, start];

	if (focus === anchor) {
		const [node, offset] = nodeOffsetAt(root, cache, focus);
		selection.collapse(node, offset);
	} else {
		const [anchorNode, anchorOffset] = nodeOffsetAt(root, cache, anchor);
		const [focusNode, focusOffset] = nodeOffsetAt(root, cache, focus);
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
