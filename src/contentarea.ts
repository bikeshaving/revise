/// <reference lib="dom" />
import type {Cursor} from "./patch";
import {Patch} from "./patch";

function isMacPlatform(): boolean {
	return window.navigator && /Mac/.test(window.navigator.platform);
}

function isSafari(): boolean {
	return window.navigator && /apple/i.test(window.navigator.vendor || "");
}

// TODO: add native undo
export type UndoMode = "none" | "keydown";

export type SelectionDirection = "forward" | "backward" | "none";

interface SelectionInfo {
	selectionStart: number;
	selectionEnd: number;
	selectionDirection: SelectionDirection;
}

export interface ContentEventDetail {
	patch: Patch;
}

export interface ContentEventInit extends CustomEventInit<ContentEventDetail> {}

export class ContentEvent extends CustomEvent<ContentEventDetail> {
	constructor(typeArg: string, eventInit: ContentEventInit) {
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
const $history = Symbol.for("revise$history");
const $onselectionchange = Symbol.for("revise$onselectionchange");
export class ContentAreaElement extends HTMLElement {
	[$cache]: NodeInfoCache;
	[$value]: string;
	[$cursor]: Cursor;
	[$history]: PatchHistory;
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
		const history = (this[$history] = new PatchHistory());
		const shadow = this.attachShadow({mode: "closed"});
		const style = document.createElement("style");
		style.textContent = css;
		shadow.appendChild(style);
		const slot = document.createElement("slot");
		this[$slot] = slot;
		slot.contentEditable = this.contentEditable;
		shadow.appendChild(slot);

		this[$observer] = new MutationObserver((records) => {
			validate(this, records);
		});

		// Because this listener is added to the document, we have to add and
		// remove the listener in the connected callback.
		this[$onselectionchange] = () => {
			const records = this[$observer].takeRecords();
			if (records.length) {
				validate(this, records);
			} else {
				const cursor = getCursor(this, this[$cache]);
				if (cursor !== undefined && !isCursorEqual(cursor, this[$cursor])) {
					// TODO: Dispatch an event here...
					this[$cursor] = cursor;
					history.checkpoint();
				}
			}
		};

		this.addEventListener("focusin", () => {
			const {
				selectionStart,
				selectionEnd,
				selectionDirection,
			} = selectionInfoFromCursor(this[$cursor]);
			this.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
		});

		this.addEventListener("input", () => {
			// TODO: Should we consider passing input event information to this function?
			validate(this, this[$observer].takeRecords());
		});

		this.addEventListener("keydown", (ev) => {
			if (this.undoMode === "keydown") {
				if (isUndoKeyboardEvent(ev)) {
					ev.preventDefault();
					this.undo();
				} else if (isRedoKeyboardEvent(ev)) {
					ev.preventDefault();
					this.redo();
				}
			}
		});
	}

	connectedCallback() {
		// TODO: Figure out a way to call validate here instead
		this[$value] = getContent(this, this[$cache], this[$value]);
		const cursor = getCursor(this, this[$cache]);
		if (cursor !== undefined) {
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
		// before calling the disconnectedCallback for some reason.
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
		validate(this, this[$observer].takeRecords());
		return this[$value];
	}

	get cursor(): Cursor {
		validate(this, this[$observer].takeRecords());
		const cursor = this[$cursor];
		if (typeof cursor === "number") {
			return cursor;
		}

		// defensive copy array cursors
		return cursor.slice() as [number, number];
	}

	get selectionStart(): number {
		validate(this, this[$observer].takeRecords());
		return selectionInfoFromCursor(this[$cursor]).selectionStart;
	}

	set selectionStart(selectionStart: number) {
		validate(this, this[$observer].takeRecords());
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
		validate(this, this[$observer].takeRecords());
		return selectionInfoFromCursor(this[$cursor]).selectionEnd;
	}

	set selectionEnd(selectionEnd: number) {
		validate(this, this[$observer].takeRecords());
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
		validate(this, this[$observer].takeRecords());
		return selectionInfoFromCursor(this[$cursor]).selectionDirection;
	}

	set selectionDirection(selectionDirection: SelectionDirection) {
		validate(this, this[$observer].takeRecords());
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

	get undoMode(): UndoMode {
		let attr = this.getAttribute("undomode");
		if (!attr) {
			return "none";
		}

		attr = attr.toLowerCase();
		if (attr === "keydown") {
			return attr;
		}

		return "none";
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

	nodeOffsetAt(index: number): [Node | null, number] {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		return nodeOffsetAt(this, cache, index);
	}

	indexOf(node: Node | null, offset: number): number {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		return indexOf(this, cache, node, offset);
	}

	repair(callback: Function, expectedValue?: string | undefined): void {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		const value = this[$value];
		if (typeof expectedValue !== "string") {
			expectedValue = value;
		}

		const {
			selectionStart,
			selectionEnd,
			selectionDirection,
		} = selectionInfoFromCursor(this[$cursor]);
		callback();
		validate(this, this[$observer].takeRecords(), {skipSelection: true});
		if (this[$value] !== expectedValue) {
			throw new Error("Expected value did not match current value");
		}

		if (value === expectedValue) {
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

	/*** History Methods ***/
	checkpoint(): void {
		this[$history].checkpoint();
	}

	undo(): void {
		validate(this, this[$observer].takeRecords());
		const value = this[$value];
		const patch = this[$history].undo();
		if (patch) {
			const historyValue = patch.apply(value);
			this[$value] = historyValue;
			this.dispatchEvent(new ContentEvent("contentundo", {detail: {patch}}));
			this[$value] = value;
			validate(this, this[$observer].takeRecords(), {skipHistory: true});
			if (this[$value] === historyValue) {
				const cursor = cursorFromPatch(patch);
				const {
					selectionStart,
					selectionEnd,
					selectionDirection,
				} = selectionInfoFromCursor(cursor);
				setSelectionRange(
					this,
					this[$cache],
					historyValue,
					selectionStart,
					selectionEnd,
					selectionDirection,
				);
			} else {
				throw new Error("undo was not correctly rendered");
			}
		}
	}

	redo(): void {
		validate(this, this[$observer].takeRecords());
		const value = this[$value];
		const patch = this[$history].redo();
		if (patch) {
			const historyValue = patch.apply(value);
			this[$value] = historyValue;
			this.dispatchEvent(new ContentEvent("contentredo", {detail: {patch}}));
			this[$value] = value;
			validate(this, this[$observer].takeRecords(), {skipHistory: true});
			if (this[$value] === historyValue) {
				const cursor = cursorFromPatch(patch);
				const {
					selectionStart,
					selectionEnd,
					selectionDirection,
				} = selectionInfoFromCursor(cursor);
				setSelectionRange(
					this,
					this[$cache],
					historyValue,
					selectionStart,
					selectionEnd,
					selectionDirection,
				);
			} else {
				throw new Error("redo was not correctly rendered");
			}
		}
	}
}

function getLowerBound(...cursors: Array<Cursor>): number {
	const cursors1: Array<number> = [];
	for (const cursor of cursors) {
		if (Array.isArray(cursor)) {
			cursors1.push(...cursor);
		} else {
			cursors1.push(cursor);
		}
	}

	return Math.min.apply(null, cursors1);
}

interface ValidateOptions {
	skipSelection?: boolean;
	skipHistory?: boolean;
}

function validate(
	area: ContentAreaElement,
	records: Array<MutationRecord>,
	{skipSelection, skipHistory}: ValidateOptions = {},
): void {
	const cache = area[$cache];
	if (invalidate(area, cache, records)) {
		const history = area[$history];
		const oldValue = area[$value];
		const oldCursor = area[$cursor];
		const value = (area[$value] = getContent(area, cache, oldValue));
		let cursor = oldCursor;
		// There appears to be a race condition in Safari where
		// document.getSelection() returns erroneous information when repair is
		// called from within a requestAnimationFrame() callback, but the cursor is
		// usually correct, so we just skip finding the new cursor information.
		if (!skipSelection) {
			const cursor1 = getCursor(area, cache);
			if (cursor1 !== undefined) {
				area[$cursor] = cursor = cursor1;
			}
		}

		if (!skipHistory) {
			const hint = getLowerBound(oldCursor, cursor);
			// TODO: This diff call is expensive. If we create a patch in getContent
			// instead of a new string, we might be able to save a lot in CPU time.
			const patch = Patch.diff(oldValue, value, hint);
			history.push(patch);
			area.dispatchEvent(new ContentEvent("contentchange", {detail: {patch}}));
		}
	}
}

// TODO: Should we allow custom newlines?
const NEWLINE = "\n";

// TODO: Allow this list of block-like elements to be overridden with an attribute.
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

interface NodeInfo {
	/** The string offset of this node relative to its parent */
	offset: number;
	/** The length of this node’s contents */
	length: number | undefined;
}

type NodeInfoCache = Map<Node, NodeInfo>;

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
): boolean {
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
		} else if (!root.contains(node)) {
			clean(node, cache);
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

			const nodeInfo = cache.get(node);
			if (nodeInfo) {
				nodeInfo.length = undefined;
			}

			invalidated = true;
		}
	}

	if (invalidated) {
		const nodeInfo = cache.get(root);
		if (nodeInfo) {
			nodeInfo.length = undefined;
		}
	}

	return invalidated;
}

function getContent(
	root: Element,
	cache: NodeInfoCache,
	oldContent: string,
): string {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	// The return value
	// TODO: It might be faster to construct a patch rather than concatenating a
	// giant string.
	let content = "";
	// A boolean which indicates whether content currently ends in a newline.
	// Because content is a heavily concatenated string and likely inferred by
	// engines as requiring a “rope-like” data structure, reading from the end of
	// the string to detect newlines is a bottleneck for most engines, so we
	// store that info in this boolean instead.
	let hasNewline = false;
	// The offset of the current node relative to its parent.
	// Should be equal to the lengths of every single sibling before the current
	// node, +1 if the parent node introduces a newline before it.
	let offset = 0;
	// The current index into oldContent.
	// If there are nodes which have cached offset and length information, we
	// read the old string rather than the DOM directly.
	let oldIndex = 0;
	// The current index into oldContent of the first sibling of the current node.
	// We compare the difference of this and the current oldIndex to the offsets
	// of nodes cached from previous renders as a way to detect deletions.
	let oldIndexRelative = 0;
	// A boolean which indicates whether we’re walking down the tree or back up.
	let descending = true;
	// A stack to save some variables as we walk up and down the tree.
	const stack: Array<{oldIndexRelative: number; nodeInfo: NodeInfo}> = [];
	// Info about the cached length of the node’s contents and offset relative to
	// the node’s parents. See invalidate() to see how mutation records are used
	// to clear the nodeInfo cache.
	let nodeInfo: NodeInfo = cache.get(root)!;
	if (nodeInfo === undefined) {
		nodeInfo = {offset, length: undefined};
		cache.set(root, nodeInfo);
	}

	for (let node: Node | null = root; node !== null; ) {
		// Walking down the tree.
		while (descending && nodeInfo.length === undefined) {
			if (
				node.nodeType === Node.TEXT_NODE ||
				(node.nodeType === Node.ELEMENT_NODE &&
					(node as Element).hasAttribute("data-content"))
			) {
				break;
			}

			const newlineBefore = !hasNewline && offset && isBlocklikeElement(node);
			if (newlineBefore) {
				content += NEWLINE;
				hasNewline = true;
			}

			const firstChild = walker.firstChild();
			if (firstChild) {
				descending = true;
			} else {
				break;
			}

			stack.push({oldIndexRelative, nodeInfo});
			oldIndexRelative = oldIndex;
			if (newlineBefore) {
				offset = NEWLINE.length;
			} else {
				offset = 0;
			}

			node = firstChild;
			// getNodeInfo
			nodeInfo = cache.get(node)!;
			if (nodeInfo === undefined) {
				nodeInfo = {offset, length: undefined};
				cache.set(node, nodeInfo);
			} else {
				const oldOffset = oldIndex - oldIndexRelative;
				if (oldOffset < nodeInfo.offset) {
					// deletion detected
					oldIndex += nodeInfo.offset - oldOffset;
				}

				nodeInfo.offset = offset;
			}
		}

		if (nodeInfo.length === undefined) {
			// Reading the current node for content.
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
			} else if (node.nodeName === "BR") {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}

			nodeInfo.length = offset - nodeInfo.offset;
		} else {
			// Reading from oldContent because length hasn’t been invalidated.
			const length = nodeInfo.length;
			const content1 = oldContent.slice(oldIndex, oldIndex + length);
			if (content1.length !== length) {
				throw new Error("String length mismatch");
			}

			content += content1;
			offset += length;
			oldIndex += length;
			hasNewline = content1.endsWith(NEWLINE);
		}

		// Finding the next node.
		node = walker.nextSibling();
		if (node) {
			descending = true;
			// getNodeInfo
			nodeInfo = cache.get(node)!;
			if (nodeInfo === undefined) {
				nodeInfo = {offset, length: undefined};
				cache.set(node, nodeInfo);
			} else {
				const oldOffset = oldIndex - oldIndexRelative;
				if (oldOffset < nodeInfo.offset) {
					// deletion detected
					oldIndex += nodeInfo.offset - oldOffset;
				}

				nodeInfo.offset = offset;
			}
		} else {
			descending = false;
			if (walker.currentNode !== root) {
				if (!stack.length) {
					throw new Error("Stack is empty");
				}

				({oldIndexRelative, nodeInfo} = stack.pop()!);
				offset = nodeInfo.offset + offset;
				node = walker.parentNode();
			}
		}
	}

	return content;
}

function indexOf(
	root: Element,
	cache: NodeInfoCache,
	node: Node | null,
	offset: number,
): number {
	if (node == null || !root.contains(node)) {
		return -1;
	}

	let index = offset;
	// TODO: handle the node being missing from the cache when we do widgets
	if (node.nodeType === Node.ELEMENT_NODE) {
		if (offset >= node.childNodes.length) {
			if (index > 0) {
				index = cache.get(node)!.length!;
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
			index += cache.get(node)!.length!;
		}
	}

	return index;
}

function nodeOffsetFromChild(
	node: Node,
	after: boolean = false,
): [Node | null, number] {
	const parentNode = node.parentNode;
	if (parentNode === null) {
		throw new Error("Node has no parent");
	}

	let offset = Array.from(parentNode.childNodes).indexOf(node as ChildNode);
	if (after) {
		offset++;
	}

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

function nodeOffsetAt(
	root: Element,
	cache: NodeInfoCache,
	index: number,
): [Node | null, number] {
	if (index < 0) {
		return [null, 0];
	}

	// A lot of the logic here works around the fact that setting the focusNode
	// of a DOM selection to a BR element subtly breaks the selection.
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

		const length = cache.get(node)!.length!;
		if (offset <= length) {
			if (node.nodeType === Node.TEXT_NODE) {
				return [node, offset];
			}

			// TODO: Simplify this
			const firstChild = walker.firstChild();
			if (firstChild) {
				// This line only matters in the case where a newline is introduced
				// before a block element.
				offset -= cache.get(firstChild)!.offset;
				node = firstChild;
			} else if (offset > 0) {
				if (node.nodeName === "BR") {
					const successor = findSuccessorNode(walker);
					if (successor) {
						if (successor.nodeName === "BR") {
							return nodeOffsetFromChild(successor);
						}

						return [successor, 0];
					} else {
						break;
					}
				} else if (isSafari()) {
					// TODO: Not sure this is working perfectly for widgets.
					return [node, 1];
				}

				return nodeOffsetFromChild(node, true);
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

	const lastNode = root.lastChild;
	if (lastNode === null) {
		return [root, 0];
	}

	const lastOffset =
		lastNode.nodeType === Node.TEXT_NODE
			? (lastNode as Text).data.length
			: lastNode.childNodes.length;
	return [lastNode, lastOffset];
}

function getCursor(root: Element, cache: NodeInfoCache): Cursor | undefined {
	const selection = document.getSelection();
	if (selection == null) {
		return undefined;
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

	if (focus === -1) {
		if (anchor !== -1) {
			return anchor;
		}

		return;
	} else if (anchor === -1) {
		if (focus !== -1) {
			return focus;
		}

		return;
	} else if (focus === anchor) {
		return focus;
	}

	return [anchor, focus];
}

function selectionInfoFromCursor(cursor: Cursor): SelectionInfo {
	let selectionStart: number;
	let selectionEnd: number;
	let selectionDirection: SelectionDirection = "none";
	if (Array.isArray(cursor)) {
		selectionStart = Math.max(0, Math.min.apply(null, cursor));
		selectionEnd = Math.max(0, Math.max.apply(null, cursor));
		selectionDirection = cursor[0] <= cursor[1] ? "forward" : "backward";
	} else {
		selectionStart = selectionEnd = Math.max(0, cursor);
	}

	return {selectionStart, selectionEnd, selectionDirection};
}

// TODO: Make the internals work based on cursors.
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

	let focus: number;
	let anchor: number;
	if (selectionDirection === "backward") {
		anchor = selectionEnd;
		focus = selectionStart;
	} else {
		anchor = selectionStart;
		focus = selectionEnd;
	}

	if (focus === anchor) {
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

/*** History stuff ***/
// TODO: Move this somewhere?
function isCursorEqual(cursor1: Cursor, cursor2: Cursor): boolean {
	cursor1 = typeof cursor1 === "number" ? [cursor1, cursor1] : cursor1;
	cursor2 = typeof cursor2 === "number" ? [cursor2, cursor2] : cursor2;
	return cursor1[0] === cursor2[0] && cursor1[1] === cursor2[1];
}

function cursorFromPatch(patch: Patch): Cursor {
	const operations = patch.operations();
	let index = 0;
	let start: number | undefined;
	let end: number | undefined;
	for (const op of operations) {
		switch (op.type) {
			case "delete": {
				if (start === undefined) {
					start = index;
				}

				break;
			}

			case "insert": {
				if (start === undefined) {
					start = index;
				}

				index += op.value.length;
				end = index;
				break;
			}

			case "retain": {
				index += op.end - op.start;
				break;
			}
		}
	}

	if (start !== undefined && end !== undefined) {
		return [start, end];
	} else if (start !== undefined) {
		return start;
	}

	return 0;
}

function isUndoKeyboardEvent(ev: KeyboardEvent): boolean {
	return (ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === "z";
}

function isRedoKeyboardEvent(ev: KeyboardEvent): boolean {
	return (
		(ev.metaKey || ev.ctrlKey) &&
		((ev.shiftKey && ev.key === "z") ||
			(!ev.shiftKey && ev.key === "y" && !isMacPlatform()))
	);
}

// TODO: Should this be a Patch method?
function isNoop(patch: Patch): boolean {
	// TODO: Think about if the second part of this condition is actually necessary
	return patch.parts.length === 1 && typeof patch.parts[0] === "number";
}

// TODO: Should this be a Patch method?
function isComplex(patch: Patch): boolean {
	const operations = patch.operations();
	let count = 0;
	for (const op of operations) {
		if (op.type !== "retain") {
			count++;
			if (count > 1) {
				return true;
			}
		}
	}

	return false;
}

// TODO: Should this be in its own module?
// The thing I worry about is that if we expose this as its own thing, people
// would probably want this class to be evented, but custom EventTarget
// subclasses still don’t work in a lot of environments.
class PatchHistory {
	currentPatch: Patch | undefined;
	undoStack: Array<Patch>;
	redoStack: Array<Patch>;

	constructor() {
		this.currentPatch = undefined;
		this.undoStack = [];
		this.redoStack = [];
	}

	checkpoint(): void {
		if (this.currentPatch) {
			this.undoStack.push(this.currentPatch);
			this.currentPatch = undefined;
		}
	}

	push(patch: Patch): void {
		if (isNoop(patch)) {
			return;
		} else if (this.redoStack.length) {
			this.redoStack.length = 0;
		}

		if (this.currentPatch) {
			const oldPatch = this.currentPatch;
			if (!isComplex(oldPatch) && !isComplex(patch)) {
				this.currentPatch = oldPatch.compose(patch);
				return;
			} else {
				this.checkpoint();
			}
		}

		this.currentPatch = patch;
	}

	canUndo(): boolean {
		return !!(this.currentPatch || this.undoStack.length);
	}

	undo(): Patch | undefined {
		this.checkpoint();
		const patch = this.undoStack.pop();
		if (patch) {
			this.redoStack.push(patch);
			return patch.invert();
		}
	}

	canRedo(): boolean {
		return !!this.redoStack.length;
	}

	redo(): Patch | undefined {
		this.checkpoint();
		const patch = this.redoStack.pop();
		if (patch) {
			this.undoStack.push(patch);
			return patch;
		}
	}
}
