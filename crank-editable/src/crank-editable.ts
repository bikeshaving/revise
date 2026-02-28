import {createElement} from "@b9g/crank/crank.js";
import type {Context, Children} from "@b9g/crank/crank.js";
import {ContentAreaElement, ContentEvent} from "@b9g/revise/contentarea.js";
import type {SelectionRange} from "@b9g/revise/contentarea.js";
import {EditableState} from "@b9g/revise/state.js";

export type {SelectionRange};
export {EditableState};

export interface CrankEditableProps {
	state: EditableState;
	children: Children;
}

export function* CrankEditable(
	this: Context<CrankEditableProps>,
	{state, children}: CrankEditableProps,
) {
	let lastEditSelection: SelectionRange | undefined;
	let pendingSelection: SelectionRange | undefined;
	let area: ContentAreaElement | undefined;
	// connectedCallback calls validate() with source=null before this.after()
	// can call el.source("render"). Skip that initial contentchange.
	let initial = true;

	const dispatchStateChange = () => {
		this.dispatchEvent(new Event("statechange", {bubbles: true}));
	};

	// contentchange: preventDefault, apply edit to state, notify parent
	this.addEventListener("contentchange", (ev: ContentEvent) => {
		const {edit, source} = ev.detail;
		if (source === "render") {
			return;
		}

		if (initial) {
			// connectedCallback fires validate() before this.after() can call
			// source("render"). The content-area and state already have the
			// same value, so just ignore this event entirely.
			initial = false;
			return;
		}

		// Capture the DOM selection BEFORE preventDefault reverts the DOM.
		// This is the browser's actual cursor position after the user's edit.
		const target = ev.target as ContentAreaElement;
		pendingSelection = target.getSelectionRange();

		ev.preventDefault();
		state.applyEdit(edit);
		lastEditSelection = pendingSelection;
		dispatchStateChange();
	});

	// beforeinput: intercept browser undo/redo
	this.addEventListener("beforeinput", (ev: Event) => {
		const {inputType} = ev as InputEvent;
		switch (inputType) {
			case "historyUndo": {
				ev.preventDefault();
				if (state.undo()) {
					lastEditSelection = state.selection;
					dispatchStateChange();
				}
				break;
			}
			case "historyRedo": {
				ev.preventDefault();
				if (state.redo()) {
					lastEditSelection = state.selection;
					dispatchStateChange();
				}
				break;
			}
		}
	});

	// keydown: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Ctrl+Y
	this.addEventListener("keydown", (ev: Event) => {
		const kev = ev as KeyboardEvent;
		const mod = kev.metaKey || kev.ctrlKey;
		if (!mod) return;

		let handled = false;
		if (kev.key === "z" || kev.key === "Z") {
			kev.preventDefault();
			handled = kev.shiftKey ? state.redo() : state.undo();
		} else if (kev.key === "y" && kev.ctrlKey && !kev.metaKey) {
			kev.preventDefault();
			handled = state.redo();
		}

		if (handled) {
			lastEditSelection = state.selection;
			dispatchStateChange();
		}
	});

	// selectionchange: checkpoint when cursor moves without editing
	const onselectionchange = () => {
		if (!area) return;

		const sel = area.getSelectionRange();
		if (
			lastEditSelection &&
			(lastEditSelection.start !== sel.start ||
				lastEditSelection.end !== sel.end)
		) {
			state.checkpoint();
		}
		lastEditSelection = sel;
	};

	document.addEventListener("selectionchange", onselectionchange);
	this.cleanup(() => {
		document.removeEventListener("selectionchange", onselectionchange);
	});

	let oldSelectionRange: SelectionRange | undefined;
	for ({state, children} of this) {
		// pendingSelection: captured from DOM before preventDefault (user edits)
		// state.selection: computed from edit operations (undo/redo)
		// oldSelectionRange: saved from DOM after previous render (fallback)
		const selectionRange = pendingSelection ?? state.selection ?? oldSelectionRange;
		pendingSelection = undefined;

		this.after((el: ContentAreaElement) => {
			area = el;

			// Always mark DOM mutations from re-renders so contentchange
			// fires with source "render" and is ignored by our handler.
			el.source("render");

			if (selectionRange) {
				el.setSelectionRange(
					selectionRange.start,
					selectionRange.end,
					selectionRange.direction,
				);

				// Scroll cursor into view
				const sel = document.getSelection();
				if (sel && sel.focusNode) {
					const focusEl =
						sel.focusNode.nodeType === Node.ELEMENT_NODE
							? (sel.focusNode as Element)
							: sel.focusNode.parentElement;
					if (focusEl) {
						focusEl.scrollIntoView({block: "nearest", inline: "nearest"});
					}
				}
			}
		});

		const areaEl: ContentAreaElement = yield createElement(
			"content-area",
			null,
			children,
		);

		// Capture the DOM selection after render for the next iteration.
		oldSelectionRange = areaEl.getSelectionRange();
	}
}

declare global {
	module Crank {
		interface EventMap {
			contentchange: ContentEvent;
			statechange: Event;
		}
	}
}
