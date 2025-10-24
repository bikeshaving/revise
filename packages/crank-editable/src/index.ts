import {jsx} from "@b9g/crank/standalone";
import type {Context, Children} from "@b9g/crank";
import type {ContentAreaElement} from "@b9g/revise/contentarea.js";
import {EditableState} from "@b9g/revise/state.js";
import type {Keyer} from "@b9g/revise/keyer.js";

// Re-export EditableState for convenience
export {EditableState} from "@b9g/revise/state.js";
export type {
	SelectionRange,
	EditableStateOptions,
	EditContext,
	EditResult,
} from "@b9g/revise/state.js";

// Context keys for providing state to child components
const EDITABLE_STATE_KEY = Symbol("editable-state");
const KEYER_KEY = Symbol("keyer");

interface EditableProps {
	state: EditableState;
	children: Children;
	class?: string;
	[key: string]: any;
}

/**
 * Editable is a Crank wrapper component that bridges the high-level EditableState
 * to the low-level ContentAreaElement DOM interface.
 *
 * Responsibilities:
 * - DOM event interception and re-sourcing
 * - Converting contentchange events to EditableState updates
 * - Providing context to child components
 * - Managing ContentAreaElement lifecycle
 * - Syncing selection state bidirectionally
 */
export function* Editable(
	this: Context<typeof Editable>,
	props: EditableProps,
) {
	let {state, children, ...rest} = props;
	let contentArea!: ContentAreaElement;
	let initial = true;

	// Provide context for child components
	this.provide(EDITABLE_STATE_KEY, state);
	this.provide(KEYER_KEY, state.keyer);

	// Handle undo/redo via beforeinput
	this.addEventListener("beforeinput", (ev: InputEvent) => {
		switch (ev.inputType) {
			case "historyUndo": {
				if (state.undo()) {
					ev.preventDefault();
				}
				break;
			}
			case "historyRedo": {
				if (state.redo()) {
					ev.preventDefault();
				}
				break;
			}
		}
	});

	// Handle undo/redo via keyboard shortcuts
	this.addEventListener("keydown", (ev: KeyboardEvent) => {
		// Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
		if (
			ev.keyCode === 0x5a /* Z */ &&
			!ev.altKey &&
			((ev.metaKey && !ev.ctrlKey) || (!ev.metaKey && ev.ctrlKey))
		) {
			if (ev.shiftKey) {
				state.redo();
			} else {
				state.undo();
			}
			ev.preventDefault();
		}
		// Ctrl+Y for redo (Windows)
		else if (
			ev.keyCode === 0x59 /* Y */ &&
			ev.ctrlKey &&
			!ev.altKey &&
			!ev.metaKey
		) {
			state.redo();
			ev.preventDefault();
		}
	});

	// Handle contentchange events from the DOM
	let ignoreInitialContentChange = true;
	this.addEventListener("contentchange", (ev: any) => {
		// Ignore the first contentchange event (initial render)
		if (ignoreInitialContentChange) {
			ignoreInitialContentChange = false;
			return;
		}

		const {edit, source} = ev.detail;

		// If source is null, this is a user edit
		if (source == null) {
			ev.preventDefault();
			state.applyEdit(edit, "contentchange");
		}
	});

	// Listen to state changes and trigger re-render
	const onChange = () => {
		this.refresh();
	};
	state.addEventListener("change", onChange);
	this.cleanup(() => {
		state.removeEventListener("change", onChange);
	});

	// Setup selection checkpointing (only on client)
	if (typeof document !== "undefined") {
		setupSelectionCheckpointing(this, state, () => contentArea);
	}

	for ({state, children, ...rest} of this) {
		// Update context if state reference changes
		this.provide(EDITABLE_STATE_KEY, state);
		this.provide(KEYER_KEY, state.keyer);

		// Get current selection or preserve from contentArea
		const selectionRange =
			state.selection ||
			(contentArea && {
				selectionStart: contentArea.selectionStart,
				selectionEnd: contentArea.selectionEnd,
				selectionDirection: contentArea.selectionDirection,
			});

		// After rendering, sync state to DOM
		if (!initial) {
			this.after(() => {
				// Set the source on the contentArea for tracking
				if (state.source !== undefined) {
					contentArea.source(state.source);
				}

				// Verify value sync
				if (state.value !== contentArea.value) {
					console.error(
						`Expected value ${JSON.stringify(
							state.value,
						)} but received ${JSON.stringify(contentArea.value)} from the DOM`,
					);
				}

				// Sync selection if element is focused
				if (contentArea.contains(document.activeElement) && selectionRange) {
					contentArea.setSelectionRange(
						Math.min(contentArea.value.length - 1, selectionRange.selectionStart),
						Math.min(contentArea.value.length - 1, selectionRange.selectionEnd),
						selectionRange.selectionDirection,
					);
				}

				// Scroll into view if needed (except for "refresh" source)
				const selection = document.getSelection();
				if (
					selection &&
					state.source !== "refresh" &&
					contentArea.contains(document.activeElement) &&
					contentArea.contains(selection.focusNode)
				) {
					let focusNode = selection.focusNode! as Element;
					if (focusNode && focusNode.nodeType === Node.TEXT_NODE) {
						focusNode = focusNode.parentNode as Element;
					}

					const rect = focusNode.getBoundingClientRect();
					if (rect.top < 0 || rect.bottom > window.innerHeight) {
						focusNode.scrollIntoView({block: "nearest"});
					}
				}
			});
		}

		yield jsx`
			<content-area
				ref=${(el: ContentAreaElement) => {
					contentArea = el;
				}}
				value=${state.value}
				renderSource=${state.source}
				...${rest}
			>
				${children}
			</content-area>
		`;

		initial = false;
	}
}

/**
 * Hook to access the EditableState from a child component.
 */
export function useEditableState(ctx: Context): EditableState {
	const state = ctx.consume(EDITABLE_STATE_KEY);
	if (!state) {
		throw new Error(
			"useEditableState must be used within an Editable component",
		);
	}
	return state as EditableState;
}

/**
 * Hook to access the Keyer from a child component.
 */
export function useKeyer(ctx: Context): Keyer {
	const keyer = ctx.consume(KEYER_KEY);
	if (!keyer) {
		throw new Error("useKeyer must be used within an Editable component");
	}
	return keyer as Keyer;
}

/**
 * Setup automatic checkpointing of edit history when selection changes.
 */
async function setupSelectionCheckpointing(
	ctx: Context,
	state: EditableState,
	getContentArea: () => ContentAreaElement,
): Promise<void> {
	// Wait for next render to get contentArea
	const root = (await new Promise((resolve) =>
		ctx.schedule(resolve),
	)) as any;
	const contentArea = getContentArea();

	let oldSelectionRange:
		| {
				selectionStart: number;
				selectionEnd: number;
				selectionDirection: string;
		  }
		| undefined;

	// Track selection changes to checkpoint history
	ctx.addEventListener("contentchange", () => {
		oldSelectionRange = {
			selectionStart: contentArea.selectionStart,
			selectionEnd: contentArea.selectionEnd,
			selectionDirection: contentArea.selectionDirection,
		};
	});

	const onselectionchange = () => {
		const newSelectionRange = {
			selectionStart: contentArea.selectionStart,
			selectionEnd: contentArea.selectionEnd,
			selectionDirection: contentArea.selectionDirection,
		};

		if (
			oldSelectionRange &&
			(oldSelectionRange.selectionStart !== newSelectionRange.selectionStart ||
				oldSelectionRange.selectionEnd !== newSelectionRange.selectionEnd ||
				oldSelectionRange.selectionDirection !==
					newSelectionRange.selectionDirection)
		) {
			state.checkpoint();
		}

		oldSelectionRange = newSelectionRange;
	};

	const onblur = () => {
		state.checkpoint();
	};

	document.addEventListener("selectionchange", onselectionchange);
	contentArea.addEventListener("blur", onblur);

	ctx.cleanup(() => {
		document.removeEventListener("selectionchange", onselectionchange);
		contentArea.removeEventListener("blur", onblur);
	});
}

/**
 * Declare the contentchange event in the global Crank namespace
 */
declare global {
	module Crank {
		interface EventMap {
			contentchange: CustomEvent;
		}
	}
}
