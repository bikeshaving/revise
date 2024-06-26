/// <reference lib="dom" />
import {Edit} from "./edit.js";

export interface ContentEventDetail {
	edit: Edit;
	source: string | null;
	mutations: Array<MutationRecord>;
}

export interface ContentEventInit extends CustomEventInit<ContentEventDetail> {}

export class ContentEvent extends CustomEvent<ContentEventDetail> {
	constructor(typeArg: string, eventInit: ContentEventInit) {
		// Maybe we should do some runtime eventInit validation.
		super(typeArg, {bubbles: true, ...eventInit});
	}
}

export type SelectionDirection = "forward" | "backward" | "none";

/********************************************/
/*** ContentAreaElement private property symbols ***/
/********************************************/
const _cache = Symbol.for("ContentAreaElement._cache");
const _value = Symbol.for("ContentAreaElement._value");
const _observer = Symbol.for("ContentAreaElement._observer");
const _onselectionchange = Symbol.for("ContentAreaElement._onselectionchange");
const _selectionStart = Symbol.for("ContentAreaElement._selectionStart");

export class ContentAreaElement extends HTMLElement {
	declare [_cache]: NodeInfoCache;
	declare [_value]: string;
	declare [_observer]: MutationObserver;
	declare [_onselectionchange]: () => void;
	declare [_selectionStart]: number;
	constructor() {
		super();

		this[_cache] = new Map();
		this[_value] = "";
		this[_observer] = new MutationObserver((records) => {
			validate(this, records);
		});

		this[_selectionStart] = 0;
		this[_onselectionchange] = () => {
			// We keep track of the starting node offset pair to accurately diff
			// edits to text nodes.
			validate(this);
			this[_selectionStart] = getSelectionRange(this).start;
		};

		this.addEventListener("input", () => {
			// This is necessary for Safari bugs where fast-repeating edits which
			// cause >40ms of execution cause the selection to lag and make pending
			// edits appear elsewhere in the DOM.
			validate(this);
		});
	}

	/******************************/
	/*** Custom Element methods ***/
	/******************************/
	connectedCallback() {
		this[_observer].observe(this, {
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
		document.addEventListener(
			"selectionchange",
			this[_onselectionchange],
			// We use capture in an attempt to run before other event listeners.
			true,
		);
	}

	disconnectedCallback() {
		this[_cache].clear();
		this[_value] = "";
		this[_observer].disconnect();
		// JSDOM-based environments like Jest sometimes make the global document
		// null before calling the disconnectedCallback for some reason.
		if (document) {
			document.removeEventListener(
				"selectionchange",
				this[_onselectionchange],
				true,
			);
		}
	}

	get value(): string {
		validate(this);
		return this[_value];
	}

	get selectionStart(): number {
		validate(this);
		return getSelectionRange(this).start;
	}

	set selectionStart(start: number) {
		validate(this);

		const {end, direction} = getSelectionRange(this);
		setSelectionRange(this, {start, end, direction});
	}

	get selectionEnd(): number {
		validate(this);
		return getSelectionRange(this).end;
	}

	set selectionEnd(end: number) {
		validate(this);
		const {start, direction} = getSelectionRange(this);
		setSelectionRange(this, {start, end, direction});
	}

	get selectionDirection(): SelectionDirection {
		validate(this);
		return getSelectionRange(this).direction;
	}

	set selectionDirection(direction: SelectionDirection) {
		validate(this);
		const {start, end} = getSelectionRange(this);
		setSelectionRange(this, {start, end, direction});
	}

	getSelectionRange(): SelectionRange {
		return getSelectionRange(this);
	}

	setSelectionRange(
		start: number,
		end: number,
		direction: SelectionDirection = "none",
	): void {
		validate(this);
		setSelectionRange(this, {start, end, direction});
	}

	indexAt(node: Node | null, offset: number): number {
		validate(this);
		return indexAt(this, node, offset);
	}

	nodeOffsetAt(index: number): [Node | null, number] {
		validate(this);
		return nodeOffsetAt(this, index);
	}

	source(source: string): boolean {
		return validate(this, this[_observer].takeRecords(), source);
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
	// TODO: explain the relationship of these numbers to newline stuff
	/** The start of this node’s contents relative to the start of the parent. */
	declare offset: number;
	/** The string length of this node’s contents. */
	declare length: number;
	/** A bitmask (see flags above) */
	declare flags: number;

	constructor(offset: number) {
		this.offset = offset;
		this.length = 0;
		this.flags = 0;
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
	records: Array<MutationRecord> = _this[_observer].takeRecords(),
	source: string | null = null,
): boolean {
	if (typeof _this !== "object" || _this[_cache] == null) {
		throw new TypeError("this is not a ContentAreaElement");
	}

	if (!invalidate(_this, records)) {
		return false;
	}

	const oldValue = _this[_value];
	const edit = diff(_this, oldValue, _this[_selectionStart]);
	_this[_value] = edit.apply(oldValue);
	const ev = new ContentEvent("contentchange", {detail: {edit, source, mutations: records}});
	Promise.resolve().then(() => _this.dispatchEvent(ev));
	return true;
}

function invalidate(
	_this: ContentAreaElement,
	records: Array<MutationRecord>,
): boolean {
	const cache = _this[_cache];
	if (!cache.get(_this)) {
		// The root ContentAreaElement will not be deleted from the cache until the
		// element is removed from the DOM, so this is the first time the
		// ContentAreaElement is being validated.
		return true;
	}

	let invalid = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		// We make sure all added and removed nodes and their children are deleted
		// from the cache in case of any weirdness where nodes have been moved.
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


// TODO: custom newlines?
const NEWLINE = "\n";

// THIS IS THE MOST COMPLICATED FUNCTION IN THE LIBRARY!
/**
 * This function both returns an edit which represents changes to the
 * ContentAreaElement, and populates the cache with info about nodes for future
 * reads.
 */
function diff(
	_this: ContentAreaElement,
	oldValue: string,
	oldSelectionStart: number,
): Edit {
	const walker = document.createTreeWalker(
		_this,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	const cache = _this[_cache];
	const stack: Array<{nodeInfo: NodeInfo; oldIndexRelative: number}> = [];
	let nodeInfo: NodeInfo;
	let value = "";
	for (
		let node: Node = _this,
			descending = true,
			/** the current offset relative to the parent */
			offset = 0,
			/** the index into the old string */
			oldIndex = 0,
			/** the index into the old string of the parent */
			oldIndexRelative = 0,
			/** Whether or not the value being built currently ends with a newline */
			hasNewline = false;
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
				const expectedOffset = oldIndex - oldIndexRelative;
				const deleteLength = nodeInfo.offset - expectedOffset;
				if (deleteLength < 0) {
					// this should never happen
					throw new Error("cache offset error");
				} else if (deleteLength > 0) {
					// deletion detected
					oldIndex += deleteLength;
				}

				nodeInfo.offset = offset;
			}

			if (offset && !hasNewline && nodeInfo.flags & IS_BLOCKLIKE) {
				// Block-like elements prepend a newline when they appear after text or
				// inline elements.
				hasNewline = true;
				offset += NEWLINE.length;
				value += NEWLINE;
				if (nodeInfo.flags & PREPENDS_NEWLINE) {
					oldIndex += NEWLINE.length;
				}

				nodeInfo.flags |= PREPENDS_NEWLINE;
			} else {
				if (nodeInfo.flags & PREPENDS_NEWLINE) {
					// deletion detected
					oldIndex += NEWLINE.length;
				}

				nodeInfo.flags &= ~PREPENDS_NEWLINE;
			}

			descending = false;
			if (nodeInfo.flags & IS_VALID) {
				// The node and its children are unchanged, so we read from the length.
				if (nodeInfo.length) {
					value += oldValue.slice(oldIndex, oldIndex + nodeInfo.length);
					oldIndex += nodeInfo.length;
					offset += nodeInfo.length;
					hasNewline =
						oldValue.slice(Math.max(0, oldIndex - NEWLINE.length), oldIndex) ===
						NEWLINE;
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				const text = (node as Text).data;
				if (text.length) {
					value += text;
					offset += text.length;
					hasNewline = text.endsWith(NEWLINE);
				}

				if (nodeInfo.flags & IS_OLD) {
					oldIndex += nodeInfo.length;
				}
			} else if ((node as Element).hasAttribute("data-content")) {
				const text = (node as Element).getAttribute("data-content") || "";
				if (text.length) {
					value += text;
					offset += text.length;
					hasNewline = text.endsWith(NEWLINE);
				}

				if (nodeInfo.flags & IS_OLD) {
					oldIndex += nodeInfo.length;
				}
			} else if (node.nodeName === "BR") {
				value += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
				if (nodeInfo.flags & IS_OLD) {
					oldIndex += nodeInfo.length;
				}
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
				// This should never happen.
				throw new Error("Stack is empty");
			}

			// If the child node prepends a newline, add to offset to increase the
			// length of the parent node.
			if (nodeInfo!.flags & PREPENDS_NEWLINE) {
				offset += NEWLINE.length;
			}

			({nodeInfo, oldIndexRelative} = stack.pop()!);
			offset = nodeInfo.offset + offset;
		}

		if (!descending) {
			// POST-ORDER LOGIC
			if (!(nodeInfo.flags & IS_VALID)) {
				// TODO: Figure out if we should always recalculate APPENDS_NEWLINE???
				if (!hasNewline && nodeInfo.flags & IS_BLOCKLIKE) {
					value += NEWLINE;
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

		if (oldIndex > oldValue.length) {
			// This should never happen.
			throw new Error("cache length error");
		}
	}

	const selectionStart = getSelectionRange(_this).start;
	// TODO: Doing a diff over the entirety of both oldValue and value is a
	// performance bottleneck. Figure out how to reduce the search for changed
	// values.
	return Edit.diff(
		oldValue,
		value,
		Math.min(oldSelectionStart, selectionStart),
	);
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
/**
 * Finds the string index of a node and offset pair provided by a browser API
 * like document.getSelection() for a given root and cache.
 */
function indexAt(
	_this: ContentAreaElement,
	node: Node | null,
	offset: number,
): number {
	const cache = _this[_cache];
	if (node == null || !_this.contains(node)) {
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

	for (; node !== _this; node = node.parentNode!) {
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
	_this: ContentAreaElement,
	index: number,
): [Node | null, number] {
	if (index < 0) {
		return [null, 0];
	}

	const [node, offset] = findNodeOffset(_this, index);
	if (node && node.nodeName === "BR") {
		// Some browsers seem to have trouble when calling `selection.collapse()`
		// with a BR element, so we try to avoid returning them from this function.
		return nodeOffsetFromChild(node);
	}

	return [node, offset];
}

// TODO: Can this function be inlined?
function findNodeOffset(
	_this: ContentAreaElement,
	index: number,
): [Node | null, number] {
	const cache = _this[_cache];
	const walker = document.createTreeWalker(
		_this,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (let node: Node | null = _this; node !== null; ) {
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
				if (node === _this) {
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

export interface SelectionRange {
	start: number;
	end: number;
	direction: SelectionDirection;
}

function getSelectionRange(_this: ContentAreaElement): SelectionRange {
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
	const focus = Math.max(0, indexAt(_this, focusNode, focusOffset));
	const anchor = isCollapsed
		? focus
		: Math.max(0, indexAt(_this, anchorNode, anchorOffset));
	return {
		start: Math.min(focus, anchor),
		end: Math.max(focus, anchor),
		direction:
			focus < anchor ? "backward" : focus > anchor ? "forward" : "none",
	};
}

function setSelectionRange(
	_this: ContentAreaElement,
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

	// Focus is the side of the selection where the pointer is released.
	const [focus, anchor] =
		direction === "backward" ? [start, end] : [end, start];

	if (focus === anchor) {
		const [node, offset] = nodeOffsetAt(_this, focus);
		selection.collapse(node, offset);
	} else {
		const [anchorNode, anchorOffset] = nodeOffsetAt(_this, anchor);
		const [focusNode, focusOffset] = nodeOffsetAt(_this, focus);
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
