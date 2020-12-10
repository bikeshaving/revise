import {factor, Patch, synthesize} from "./patch";
import {difference, expand, interleave, shrink, Subseq, union} from "./subseq";

export function rewind(hiddenSeq: Subseq, patches: Patch[]): Subseq {
	for (let i = patches.length - 1; i >= 0; i--) {
		const [, insertSeq, deleteSeq] = factor(patches[i]);
		hiddenSeq = difference(hiddenSeq, deleteSeq);
		hiddenSeq = shrink(hiddenSeq, insertSeq);
	}
	return hiddenSeq;
}

export function fastForward(hiddenSeq: Subseq, patches: Patch[]): Subseq {
	for (let i = 0; i < patches.length; i++) {
		const [, insertSeq, deleteSeq] = factor(patches[i]);
		hiddenSeq = expand(hiddenSeq, insertSeq);
		hiddenSeq = union(hiddenSeq, deleteSeq);
	}
	return hiddenSeq;
}

export function rebase(
	patch1: Patch,
	patches: Patch[],
	comparator: (i: number) => number,
): [Patch, Patch[]] {
	const patches1: Patch[] = [];
	if (patches.length) {
		let [inserted1, insertSeq1, deleteSeq1] = factor(patch1);
		for (let i = 0; i < patches.length; i++) {
			let [inserted2, insertSeq2, deleteSeq2] = factor(patches[i]);
			const c = comparator(i);
			if (c !== 0) {
				if (c < 0) {
					[insertSeq1, insertSeq2] = interleave(insertSeq1, insertSeq2);
				} else {
					[insertSeq2, insertSeq1] = interleave(insertSeq2, insertSeq1);
				}
				deleteSeq1 = expand(deleteSeq1, insertSeq2);
				deleteSeq2 = expand(deleteSeq2, insertSeq1);
				patches1.push(synthesize(inserted2, insertSeq2, deleteSeq2));
			}
		}
		patch1 = synthesize(inserted1, insertSeq1, deleteSeq1);
	}
	return [patch1, patches1];
}

export function slideForward(
	patches: Patch[],
	predicate: (i: number) => boolean,
): Patch[] {
	const patches1: Patch[] = [];
	let expandSeq: Subseq | undefined;
	for (let i = patches.length - 1; i >= 0; i--) {
		let patch = patches[i];
		let [inserted, insertSeq, deleteSeq] = factor(patch);
		if (predicate(i)) {
			if (expandSeq != null) {
				deleteSeq = expand(deleteSeq, expandSeq);
				insertSeq = expand(insertSeq, expandSeq);
				expandSeq = shrink(expandSeq, insertSeq);
				patch = synthesize(inserted, insertSeq, deleteSeq);
			}
			patches1.unshift(patch);
		} else {
			if (expandSeq == null) {
				expandSeq = insertSeq;
			} else {
				expandSeq = expand(insertSeq, expandSeq, {union: true});
			}
		}
	}
	return patches1;
}

export function slideBackward(
	patches: Patch[],
	predicate: (i: number) => boolean,
): Patch[] {
	const patches1: Patch[] = [];
	let expandSeq: Subseq | undefined;
	for (let i = 0; i < patches.length; i++) {
		let patch = patches[i];
		let [inserted, insertSeq, deleteSeq] = factor(patch);
		if (predicate(i)) {
			if (expandSeq != null) {
				expandSeq = expand(expandSeq, insertSeq);
				insertSeq = shrink(insertSeq, expandSeq);
				deleteSeq = shrink(deleteSeq, expandSeq);
				patch = synthesize(inserted, insertSeq, deleteSeq);
			}
			patches1.push(patch);
		} else {
			if (expandSeq == null) {
				expandSeq = insertSeq;
			} else {
				expandSeq = expand(expandSeq, insertSeq, {union: true});
			}
		}
	}
	return patches1;
}
