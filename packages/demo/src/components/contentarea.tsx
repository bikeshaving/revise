import {
	ContentEvent,
	ContentAreaElement,
} from '@bikeshaving/revise/contentarea.js';
import type {SelectionRange} from '@bikeshaving/revise/contentarea.js';
import {Keyer} from '@bikeshaving/revise/keyer.js';

import {createElement} from '@bikeshaving/crank/crank.js';
import type {Context} from '@bikeshaving/crank/crank.js';

export interface ContentAreaProps {
	children: unknown;
	selectionRange?: SelectionRange | undefined;
	value?: string | undefined;
	renderSource?: string | undefined;
}

export function* ContentArea(
	this: Context<ContentAreaProps>,
	{children, selectionRange, value, renderSource}: ContentAreaProps,
) {
	const initialSelectionRange = {
		selectionStart: 0,
		selectionEnd: 0,
		selectionDirection: 'none',
	} as const;

	const keyer = new Keyer();
	this.provide('ContentAreaKeyer', keyer);

	this.addEventListener('contentchange', (ev) => {
		keyer.transform(ev.detail.edit);
	});

	let composing = false;
	this.addEventListener('compositionstart', () => {
		composing = true;
	});

	this.addEventListener('compositionend', () => {
		composing = false;
		this.refresh();
	});

	let newSelectionRange: SelectionRange | null | undefined;
	for ({
		children,
		selectionRange: newSelectionRange = selectionRange || initialSelectionRange,
		value,
		renderSource,
	} of this) {
		if (newSelectionRange) {
			selectionRange = newSelectionRange;
		}

		this.flush((el) => {
			if (typeof renderSource === 'string') {
				el.source(renderSource);
			}

			if (typeof value === 'string' && value !== el.value) {
				console.error(
					`Expected value ${JSON.stringify(
						value,
					)} but received ${JSON.stringify(el.value)} from the DOM`,
				);
			}

			el.setSelectionRange(
				selectionRange!.selectionStart,
				selectionRange!.selectionEnd,
				selectionRange!.selectionDirection,
			);
		});

		const el = yield (
			<content-area crank-static={composing}>{children}</content-area>
		);

		selectionRange = el.getSelectionRange();
	}
}

declare global {
	module Crank {
		interface EventMap {
			contentchange: ContentEvent;
		}
	}
}

if (!window.customElements.get('content-area')) {
	window.customElements.define('content-area', ContentAreaElement);
}
