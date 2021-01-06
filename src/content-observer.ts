import {Patch} from "./patch";
import {Subseq} from "./subseq";
// TODO: stop hardcoding this so we can have \r\n documents???
const NEWLINE = "\n";

/**
 * A symbol property added to the root node which is being observed. It is set
 * to the string content of the entire DOM node.
 */
export const Content = Symbol.for("revise.Content");

/**
 * A symbol property added to every Text and Element node of the DOM tree which
 * is being observed. It is set to the length of the contents of all nodes
 * before this node, and is used to identify the positions of selections and
 * edits in the tree.
 */
export const ContentOffset = Symbol.for("revise.ContentOffset");

declare global {
	interface Node {
		[Content]?: string | undefined;
		[ContentOffset]?: number | undefined;
	}
}

// TODO: Mutations in non-contenteditable widgets should be ignored.
// TODO: Mutations in nested contenteditables should be ignored.
// TODO: Figure out how to limit the amount of work we need to do with
// getContent by actually reading mutation records themselves.
// TODO: Figure out what records we should emit.
// TODO: Integrate with an undo stack of some kind.
// TODO: Multiple targets.
export interface ContentRecord {
	target: Node;
	content: string;
	cursor: number;
}

export class ContentObserver {
	_target: Node | null;
	_mutationObserver: MutationObserver;
	constructor(callback: (record: ContentRecord) => unknown) {
		this._target = null;
		this._mutationObserver = new MutationObserver((records) => {
			const target = this._target!;
			invalidateTargets(target, records);
			const content = getContent(target);
			const selection = window.getSelection()!;
			const cursor = getIndexFromPosition(
				target,
				selection.focusNode,
				selection.focusOffset,
			);
			callback({target, content, cursor});
		});
	}

	// TODO: Pass in intended content to observe so we can get an initial diff.
	observe(target: Node) {
		this._target = target;
		getContent(target);
		this._mutationObserver.observe(target, {
			subtree: true,
			childList: true,
			characterData: true,
			characterDataOldValue: true,
		});
	}

	disconnect() {
		this._target = null;
		this._mutationObserver.disconnect();
	}
}

function invalidateTargets(root: Node, records: Array<MutationRecord>): void {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		let target = record.target;
		if (
			typeof target[ContentOffset] === "undefined" ||
			!root.contains(target)
		) {
			continue;
		}

		for (; target !== root; target = target.parentNode!) {
			if (typeof target[ContentOffset] === "undefined") {
				break;
			}

			target[ContentOffset] = undefined;
			invalidated = true;
		}
	}

	if (invalidated) {
		root[ContentOffset] = undefined;
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

const NOOP = () => {};

function walk(
	rootNode: Node,
	{
		whatToShow = NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
		pre = NOOP,
		post = NOOP,
	}: {
		whatToShow?: number;
		pre?: (node: Node) => unknown;
		post?: (node: Node) => unknown;
	},
): void {
	const walker = document.createTreeWalker(rootNode, whatToShow);
	const seen = new Set<Node>();
	outer: for (
		let currentNode: Node | null = walker.currentNode;
		currentNode !== null;
		currentNode = walker.nextSibling() || walker.parentNode()
	) {
		if (!seen.has(currentNode)) {
			let firstChild: Node | null;
			while (true) {
				if (pre(currentNode)) {
					continue outer;
				}

				firstChild = walker.firstChild();
				if (firstChild) {
					seen.add(currentNode);
					currentNode = firstChild;
				} else {
					break;
				}
			}
		}

		post(currentNode);
	}
}

export function getContent(root: Node): string {
	let content = "";
	let offset = 0;
	let hasNewline = false;
	const invalidated: Array<Node> = [];
	walk(root, {
		pre(node) {
			if (node !== root && typeof node[Content] !== "undefined") {
				throw new Error("Cannot observe nodes within a content observer");
			}

			if (typeof node[ContentOffset] === "undefined") {
				invalidated.push(node);
			}

			if (!hasNewline && offset && isBlocklikeElement(node)) {
				hasNewline = true;
				content += NEWLINE;
				offset += NEWLINE.length;
			}

			node[ContentOffset] = offset;
		},
		post(node) {
			if (node.nodeName === "BR") {
				hasNewline = true;
				content += NEWLINE;
				offset += NEWLINE.length;
			} else if (node.nodeType === Node.TEXT_NODE) {
				const content1 = (node as Text).data;
				hasNewline = content1.endsWith(NEWLINE);
				content += content1;
				offset += content1.length;
			} else if (!hasNewline && node.firstChild && isBlocklikeElement(node)) {
				hasNewline = true;
				content += NEWLINE;
				offset += NEWLINE.length;
			}

			if (node === root) {
				node[Content] = content;
			}
		},
	});

	return content;
}

/**
 * Retrieves the next sibling of the current node, or the next sibling of the
 * current node’s parent. Will continue searching upwards until a next sibling
 * is found or we reached the root of the true.
 */
function getNextNode(rootNode: Node, node: Node): Node | null {
	const walker = document.createTreeWalker(
		rootNode,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	for (let currentNode: Node | null = node; currentNode !== null; ) {
		currentNode = walker.nextSibling();
		if (currentNode === null) {
			currentNode = walker.parentNode();
		} else {
			return currentNode;
		}
	}

	return null;
}

type Cursor = [number, number] | number | null;

function getIndexFromPosition(
	rootNode: Node,
	node: Node | null,
	offset: number,
): number {
	if (
		node === null ||
		!rootNode.contains(node) ||
		typeof node[ContentOffset] === "undefined"
	) {
		return -1;
	} else if (node.nodeType === Node.TEXT_NODE) {
		return node[ContentOffset]! + offset;
	}

	if (offset >= node.childNodes.length) {
		// In Firefox, when inserting a soft newline, a BR element is inserted, the
		// selection node is set to the parent node of the BR, and the selection
		// offset is set to the length of the childNodes.
		const nextNode = getNextNode(rootNode, node);
		if (nextNode === null || typeof nextNode[ContentOffset] === "undefined") {
			// TODO: return the length of the content
			return rootNode[Content]!.length;
		}

		return nextNode[ContentOffset]!;
	} else if (offset < 0 || typeof node.childNodes[offset] === "undefined") {
		return node[ContentOffset]!;
	}

	return node.childNodes[offset][ContentOffset]!;
}

function getNodeLength(node: Text | Element): number {
	return node.nodeType === Node.TEXT_NODE
		? (node as Text).data.length
		: node.childNodes.length;
}

// TODO: Figure out how this function should be called and exported.
export function getPositionFromIndex(
	rootNode: Node,
	index: number,
): [Node | null, number] {
	if (typeof rootNode[Content] === "undefined") {
		throw new Error("Unknown node");
	}

	if (index < 0 || index > rootNode[Content]!.length) {
		return [null, 0];
	}

	const walker = document.createTreeWalker(
		rootNode,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (
		let currentNode = walker.firstChild();
		currentNode !== null;
		currentNode = walker.currentNode
	) {
		const offset = currentNode[ContentOffset];
		if (offset === undefined) {
			throw new Error("Unknown node");
		} else if (index === offset) {
			if (currentNode.nodeName === "BR") {
				// Firefox has trouble when selections reference BR elements.
				const previousSibling = walker.previousSibling();
				if (previousSibling === null || previousSibling.nodeName === "BR") {
					const parentNode = currentNode.parentNode!;
					const offset = Array.from(parentNode.childNodes).indexOf(
						currentNode as ChildNode,
					);
					return [parentNode, offset];
				}

				return [
					previousSibling,
					getNodeLength(previousSibling as Text | Element),
				];
			}

			return [currentNode, 0];
		} else if (index < offset) {
			const previousSibling = walker.previousSibling();
			if (previousSibling === null) {
				return [walker.parentNode(), 0];
			} else if (previousSibling.nodeType === Node.TEXT_NODE) {
				const offset1 = index - previousSibling[ContentOffset]!;
				return [previousSibling, offset1];
			} else if (walker.firstChild() === null) {
				return [
					previousSibling,
					getNodeLength(previousSibling as Text | Element),
				];
			}
		} else if (walker.nextSibling() === null) {
			if (currentNode.nodeType === Node.TEXT_NODE) {
				return [
					currentNode,
					Math.min(index - offset, getNodeLength(currentNode as Text)),
				];
			} else if (walker.firstChild() === null) {
				return [currentNode, getNodeLength(currentNode as Text | Element)];
			}
		}
	}

	return [null, 0];
}
