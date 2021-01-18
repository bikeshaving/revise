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

/**
 * A symbol property added to every Text and Element node of the DOM tree which
 * is being observed. It is set to the length of the contents of all nodes
 * before this node, and is used to identify the positions of selections and
 * edits in the tree.
 */
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
	cursor: Cursor;
}

// TODO: Multiple targets.
export class ContentObserver {
	_root: Node | null;
	_mutationObserver: MutationObserver;
	_onselectionchange: () => unknown;
	constructor(callback: (record: ContentRecord) => unknown) {
		this._root = null;
		this._mutationObserver = new MutationObserver((records) => {
			const root = this._root;
			if (!root) {
				return;
			}

			// TODO: Use invalidate and patches as opposed to reading the entire tree.
			// invalidate(root, records);
			// const patch = getPatch(root);
			const content = getContent(root);
			const selection = window.getSelection()!;
			const cursor = cursorFromSelection(root, selection);
			callback({
				type: "mutation",
				root,
				content,
				cursor,
			});
		});

		this._onselectionchange = () => {
			const root = this._root;
			if (!root) {
				return;
			}

			const selection = document.getSelection();
			const cursor = cursorFromSelection(root, selection);
			if (cursor === -1) {
				return;
			}

			callback({
				type: "selectionchange",
				root,
				content: root[Content]!,
				cursor,
			});
		};
	}

	// TODO: Pass in intended content to observe so we can get an initial diff?
	observe(root: Node) {
		this._root = root;
		// Marking the offset/lengths of the root
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

// TODO: Use local offsets! Using global offsets makes working with invalidated
// nodes more difficult because you have to recurse into the descendents of
// next sibling nodes, effectively negating any of the performance benefits of
// specific invalidating nodes.
export function getContent(root: Node): string {
	let content = "";
	let hasNewline = false;
	let offset = 0;
	const localOffsets: Array<number> = [];
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	walker.currentNode = root;
	const seen = new Set<Node>();
	for (
		let node: Node | null = root;
		node !== null;
		node = walker.nextSibling() || walker.parentNode()
	) {
		if (!seen.has(node)) {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				if (node !== root && typeof node[Content] !== "undefined") {
					throw new Error("Cannot observe nodes within a content observer");
				}

				// Should this come before or after the newline check?
				node[ContentOffset] = offset;
				if (!hasNewline && offset && isBlocklikeElement(node)) {
					content += NEWLINE;
					offset += NEWLINE.length;
					hasNewline = true;
				}

				const firstChild = walker.firstChild();
				if (firstChild) {
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

		node[ContentLength] = offset - node[ContentOffset]!;
	}

	root[Content] = content;
	return content;
}

export type NodeOffset = [Node | null, number];

// TODO: Should we use null when the editable is not focused, or should we use -1?
// TODO: Should we allow descending ranges for cursors? ([5, 0] to indicate a
// selection whose focus node and offset appear before the anchor node and
// offset).
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
		typeof node[ContentOffset] === "undefined"
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
				//       ^ newline introduced here.
				// TODO: This logic may change when we switch to local offsets.
				index += (node[ContentOffset] || 0) - (parentNode[ContentOffset] || 0);
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

// TODO: Figure out how this function should be called and exported.
export function nodeOffsetFromIndex(root: Node, index: number): NodeOffset {
	debugger;
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
	let node: Node | null = walker.currentNode;
	let offset = index;
	while (node !== null) {
		const length = node[ContentLength] || 0;
		if (offset <= length) {
			if (node.nodeType === Node.TEXT_NODE) {
				return [node, offset];
			}

			const firstChild = walker.firstChild();
			if (firstChild) {
				offset -= (firstChild[ContentOffset] || 0) - (node[ContentOffset] || 0);
			}

			node = firstChild;
		} else {
			offset -= length;
			node = walker.nextSibling();
			if (node === null) {
				node = walker.parentNode();
				break;
			}
		}
	}

	node = walker.currentNode;
	if (offset > 0) {
		let nextNode: Node | null = node;
		while (nextNode !== null) {
			nextNode = walker.nextSibling();
			if (nextNode === null) {
				nextNode = walker.parentNode();
			} else {
				break;
			}
		}

		if (nextNode) {
			return [nextNode, 0];
		}
	}

	// Firefox breaks when a selection’s focusNode or anchorNode is set to a
	// BR element.
	if (node && node.nodeName === "BR") {
		const parentNode = node.parentNode!;
		const offset = Array.from(parentNode.childNodes).indexOf(
			node as ChildNode,
		);
		return [parentNode, offset];
	}

	return [node, node ? node.childNodes.length : 0];
}

export function setSelection(
	selection: Selection,
	root: Node,
	cursor: Cursor,
): void {
	const anchor = typeof cursor === "number" ? cursor : cursor[0];
	const focus = typeof cursor === "number" ? cursor : cursor[1];
	if (anchor === focus) {
		const [node, offset] = nodeOffsetFromIndex(root, focus);
		if (selection.focusNode !== node || selection.focusOffset !== offset) {
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
