export function findLastIndex<T>(
	arr: T[],
	pred: (v: T, i: number, arr: T[]) => any,
): number {
	for (let i = arr.length - 1; i >= 0; i--) {
		if (pred(arr[i], i, arr)) {
			return i;
		}
	}
	return -1;
}

export function findLast<T>(
	arr: T[],
	pred: (v: T, i: number, arr: T[]) => any,
): T | undefined {
	const i = findLastIndex(arr, pred);
	if (i === -1) {
		return;
	}
	return arr[i];
}
