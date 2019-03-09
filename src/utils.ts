export function timeout<T>(
  delay: number = 0,
  promise?: Promise<T>,
): Promise<T | undefined> {
  const timeout: Promise<undefined> = new Promise((resolve) =>
    setTimeout(resolve, delay),
  );
  if (promise == null) {
    return timeout;
  }
  return Promise.race([timeout, promise]);
}

export function findLastIndex<T>(
  arr: T[],
  test: (v: T, i: number, arr: T[]) => any,
): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (test(arr[i], i, arr)) {
      return i;
    }
  }
  return -1;
}

export function findLast<T>(
  arr: T[],
  test: (v: T, i: number, arr: T[]) => any,
): T | undefined {
  const i = findLastIndex(arr, test);
  if (i === -1) {
    return;
  }
  return arr[i];
}
