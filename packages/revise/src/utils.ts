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

export function* invert<T>(arr: T[]): IterableIterator<T> {
  for (let i = arr.length - 1; i >= 0; i--) {
    yield arr[i];
  }
}

type Contender<T> = T | Promise<T> | AsyncIterableIterator<T>;

function* results<T>(
  contenders: Iterable<Contender<T>>,
): IterableIterator<Promise<IteratorResult<T>>> {
  for (const contender of contenders) {
    if ("then" in contender && typeof contender.then === "function") {
      yield (contender as Promise<T>).then((value: T) => ({
        value,
        done: true,
      }));
    } else if ("next" in contender && typeof contender.next === "function") {
      yield contender.next();
    } else {
      yield Promise.resolve({ value: contender as T, done: true });
    }
  }
}

export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  contenders: [
    Contender<T1>,
    Contender<T2>,
    Contender<T3>,
    Contender<T4>,
    Contender<T5>,
    Contender<T6>,
    Contender<T7>,
    Contender<T8>,
    Contender<T9>,
    Contender<T10>
  ],
): AsyncIterableIterator<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  contenders: [
    Contender<T1>,
    Contender<T2>,
    Contender<T3>,
    Contender<T4>,
    Contender<T5>,
    Contender<T6>,
    Contender<T7>,
    Contender<T8>,
    Contender<T9>
  ],
): AsyncIterableIterator<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
export function race<T1, T2, T3, T4, T5, T6, T7, T8>(
  contenders: [
    Contender<T1>,
    Contender<T2>,
    Contender<T3>,
    Contender<T4>,
    Contender<T5>,
    Contender<T6>,
    Contender<T7>,
    Contender<T8>
  ],
): AsyncIterableIterator<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
export function race<T1, T2, T3, T4, T5, T6, T7>(
  contenders: [
    Contender<T1>,
    Contender<T2>,
    Contender<T3>,
    Contender<T4>,
    Contender<T5>,
    Contender<T6>,
    Contender<T7>
  ],
): AsyncIterableIterator<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
export function race<T1, T2, T3, T4, T5, T6>(
  contenders: [
    Contender<T1>,
    Contender<T2>,
    Contender<T3>,
    Contender<T4>,
    Contender<T5>,
    Contender<T6>
  ],
): AsyncIterableIterator<T1 | T2 | T3 | T4 | T5 | T6>;
export function race<T1, T2, T3, T4, T5>(
  contenders: [
    Contender<T1>,
    Contender<T2>,
    Contender<T3>,
    Contender<T4>,
    Contender<T5>
  ],
): AsyncIterableIterator<T1 | T2 | T3 | T4 | T5>;
export function race<T1, T2, T3, T4>(
  contenders: [Contender<T1>, Contender<T2>, Contender<T3>, Contender<T4>],
): AsyncIterableIterator<T1 | T2 | T3 | T4>;
export function race<T1, T2, T3>(
  contenders: [Contender<T1>, Contender<T2>, Contender<T3>],
): AsyncIterableIterator<T1 | T2 | T3>;
export function race<T1, T2>(
  contenders: [Contender<T1>, Contender<T2>],
): AsyncIterableIterator<T1 | T2>;
export function race<T>(
  contenders: Iterable<Contender<T>>,
): AsyncIterableIterator<T>;
export async function* race(contenders: Iterable<Contender<any>>) {
  try {
    let result: IteratorResult<any>;
    do {
      result = await Promise.race(results(contenders));
      yield result.value;
    } while (!result.done);
  } finally {
    for (const contender of contenders) {
      if ("return" in contender && typeof contender.return === "function") {
        await contender.return();
      }
    }
  }
}
