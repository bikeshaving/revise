import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {ContentEvent, ContentAreaElement} from "@b9g/revise/contentarea.js";
import type {SelectionRange} from "@b9g/revise/contentarea.js";

export interface ContentAreaProps {
	children: unknown;
	selectionRange?: SelectionRange | undefined;
	value?: string | undefined;
	renderSource?: string | undefined;
}

export function* ContentArea(
	this: Context<ContentAreaProps>,
	{value, children, selectionRange, renderSource}: ContentAreaProps,
) {

	let oldSelectionRange: SelectionRange | undefined;
	for ({
		value,
		children,
		selectionRange = oldSelectionRange,
		renderSource,
	} of this) {
		this.after((area) => {
			if (typeof renderSource === "string") {
				area.source(renderSource);
			}

			if (typeof value === "string" && value !== area.value) {
				console.error(
					`Expected value ${JSON.stringify(
						value,
					)} but received ${JSON.stringify(area.value)} from the DOM`,
				);
			}

			if (selectionRange) {
				area.setSelectionRange(
					selectionRange.start,
					selectionRange.end,
					selectionRange.direction,
				);
			}
		});

		const area: ContentAreaElement = yield (
			<content-area>{children}</content-area>
		);

		oldSelectionRange = area.getSelectionRange();
	}
}

declare global {
	module Crank {
		interface EventMap {
			contentchange: ContentEvent;
		}
	}
}

if (!window.customElements.get("content-area")) {
	window.customElements.define("content-area", ContentAreaElement);
}
