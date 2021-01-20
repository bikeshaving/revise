// TODO: stop hardcoding this so we can have \r\n documents???
const NEWLINE = "\n";

//TODO: Use a single symbol property.

/**
 * A symbol property added to the root node which is being observed. It is set
 * to the string content of the entire DOM node.
 *
 * Maybe this can be set to some kind of controller object instead.
 */
export const Content = Symbol.for("revise.Content");

export const ContentOffset = Symbol.for("revise.ContentOffset");

export const ContentLength = Symbol.for("revise.ContentLength");

declare global {
	interface Node {
		[Content]?: string | undefined;
		[ContentOffset]?: number | undefined;
		[ContentLength]?: number | undefined;
	}
}

// TODO: expose methods via a ContentController class.

// TODO: Mutations in non-contenteditable widgets should be ignored.
// TODO: Mutations in nested contenteditables should be ignored.
// TODO: Figure out how to limit the amount of work we need to do with
// getContent by actually reading mutation records themselves.
// TODO: Figure out what records we should emit.
// TODO: Integrate with an undo stack of some kind.
export interface ContentRecord {
	type: string;
	root: Node;
	content: string;
	//patch: Patch;
	cursor: Cursor;
}

// TODO: Multiple targets.
export class ContentObserver {
	_root: Node | null;
	_mutationObserver: MutationObserver;
	_onselectionchange: () => unknown;
	constructor(callback: (record: ContentRecord) => unknown) {
		this._root = null;
		this._mutationObserver = new MutationObserver((_records) => {
			const root = this._root;
			if (!root) {
				return;
			}

			// TODO: Use invalidate and patches as opposed to reading the entire tree.
			// invalidate(root, records);
			// const patch = getPatch(root);
			const content = getContent(root);
			const selection = document.getSelection();
			const cursor = cursorFromSelection(root, selection);
			callback({
				type: "mutation",
				root,
				content,
				cursor,
			});
		});

		// TODO: Is this necessary or a good idea?
		this._onselectionchange = () => {
			// We have to execute this code in a microtask callback or
			// contenteditables become uneditable in Safari.
			// (but only when the console is closed?)
			queueMicrotask(() => {
				const root = this._root;
				if (!root) {
					return;
				}

				const selection = document.getSelection();
				const cursor = cursorFromSelection(root, selection);
				callback({
					type: "selectionchange",
					root,
					content: root[Content]!,
					cursor,
				});
			});
		};
	}

	// TODO: Pass in intended content to observe so we can get an initial diff?
	observe(root: Node) {
		this._root = root;
		// We need to mark the lengths and offsets.
		getContent(root);
		this._mutationObserver.observe(root, {
			subtree: true,
			childList: true,
			characterData: true,
			characterDataOldValue: true,
			// TODO: We need to listen to attribute changes for widgets.
		});
		document.addEventListener("selectionchange", this._onselectionchange);
	}

	disconnect() {
		this._root = null;
		this._mutationObserver.disconnect();
		// TODO: only remove the event listener if all roots are disconnected.
		document.removeEventListener("selectionchange", this._onselectionchange);
	}

	repairCursor(callback: Function): void {
		const root = this._root;
		if (!root) {
			return;
		}

		const selection = document.getSelection();
		const cursor = cursorFromSelection(root, selection);
		callback();
		getContent(root);
		setSelection(selection, root, cursor);
	}
}

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

// TODO: Make this function incremental!
// TODO: Make this function return patches?
export function getContent(root: Node): string {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	walker.currentNode = root;
	let content = "";
	let hasNewline = false;
	let offset = 0;
	const offsets: Array<number> = [];
	const seen = new Set<Node>();
	for (let node: Node | null = root; node !== null; ) {
		if (!seen.has(node)) {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				if (node !== root && typeof node[Content] !== "undefined") {
					throw new Error("Cannot observe nodes within a content observer");
				}

				node[ContentOffset] = offset;
				const newlineBefore = !hasNewline && offset && isBlocklikeElement(node);
				if (newlineBefore) {
					content += NEWLINE;
					hasNewline = true;
				}

				const firstChild = walker.firstChild();
				if (firstChild) {
					offsets.push(offset);
					offset = newlineBefore ? NEWLINE.length : 0;
					seen.add(node);
					node = firstChild;
				} else {
					break;
				}
			}
		}

		if (node.nodeType === Node.TEXT_NODE) {
			const content1 = (node as Text).data;
			content += content1;
			offset += content1.length;
			hasNewline = content1.endsWith(NEWLINE);
		} else if (node.nodeName === "BR") {
			content += NEWLINE;
			offset += NEWLINE.length;
			hasNewline = true;
		} else {
			if (
				!hasNewline &&
				isBlocklikeElement(node) &&
				// TODO: We check that the any block-like elements that aren’t the root
				// have at least one child, to deal with empty divs and such, but I am
				// not sure about this logic. For instance, empty divs non-zero heights
				// seem to record as a newline according to content-editable algorithms.
				(node === root || node.firstChild)
			) {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}
		}

		const length = offset - node[ContentOffset]!;
		node[ContentLength] = length;
		node = walker.nextSibling();
		if (node === null) {
			offset = offsets.pop()! + offset;
			node = walker.parentNode();
		}
	}

	root[Content] = content;
	return content;
}

/**
 * Given an observed root, and an array of mutation records, this function
 * invalidates nodes which have changed children by deleting the ContentLength
 * property.
 *
 * This function should be used in conjunction with the getPatch() function
 * below.
 */
function _invalidate(root: Node, records: Array<MutationRecord>): void {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		let target = record.target;
		// TODO: handle non-contenteditable widgets
		if (target === root) {
			invalidated = true;
			continue;
		} else if (
			typeof target[ContentLength] === "undefined" ||
			!root.contains(target)
		) {
			continue;
		}

		for (; target !== root; target = target.parentNode!) {
			if (typeof target[ContentLength] === "undefined") {
				break;
			}

			target[ContentLength] = undefined;
			invalidated = true;
		}
	}

	if (invalidated) {
		root[ContentLength] = undefined;
	}
}

export type NodeOffset = [Node | null, number];

export type Cursor = [number, number] | number;

// TODO: Should we be exporting this???
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
			index = node[ContentLength] || 0;
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
				// This line deals with block elements which introduce a line break
				// before them.
				// "hello<div>world</div>"
				//			 ^ newline introduced here.
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

export function cursorFromSelection(
	root: Node,
	selection: Selection | null,
): Cursor {
	if (selection == null) {
		return -1;
	}

	const focus = indexFromNodeOffset(
		root,
		selection.focusNode,
		selection.focusOffset,
	);

	let anchor: number;
	if (selection.isCollapsed) {
		anchor = focus;
	} else {
		anchor = indexFromNodeOffset(
			root,
			selection.anchorNode,
			selection.anchorOffset,
		);
	}

	if (focus === anchor || focus === -1 || anchor === -1) {
		return focus;
	}

	return [anchor, focus];
}

function createParentNodeOffset(node: Node): [Node, number] {
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

export function nodeOffsetFromIndex(root: Node, index: number): NodeOffset {
	if (typeof root[Content] === "undefined") {
		throw new Error("Unknown node");
	}

	if (index < 0) {
		return [null, 0];
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	let node: Node | null = root;
	walker.currentNode = node;
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

export function setSelection(
	selection: Selection | null,
	root: Node,
	cursor: Cursor,
): void {
	if (!selection) {
		return;
	}

	const anchor = typeof cursor === "number" ? cursor : cursor[0];
	const focus = typeof cursor === "number" ? cursor : cursor[1];
	if (anchor === focus) {
		const [node, offset] = nodeOffsetFromIndex(root, focus);
		// Chrome seems to draw selections which point to a BR element incorrectly
		// when there are two adjacent BR elements and the second has been deleted
		// backwards, so we force a redraw.
		const force =
			node &&
			node.nodeType === Node.ELEMENT_NODE &&
			node.childNodes[offset] &&
			node.childNodes[offset].nodeName === "BR";
		if (
			force ||
			selection.focusNode !== node ||
			selection.focusOffset !== offset
		) {
			selection.collapse(node, offset);
		}

		return;
	}

	const range = selection.getRangeAt(0);
	const [anchorNode, anchorOffset] = nodeOffsetFromIndex(root, anchor);
	const [focusNode, focusOffset] = nodeOffsetFromIndex(root, focus);
	if (anchorNode) {
		range.setStart(anchorNode, anchorOffset);
	}

	if (focusNode) {
		range.setEnd(focusNode, focusOffset);
	}
}
