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

type Contender<T> = T | Promise<T> | Iterable<T> | AsyncIterable<T>;

function iterators<T>(
  contenders: Iterable<Contender<T>>,
): (Iterator<T> | AsyncIterator<T>)[] {
  const iters: (Iterator<T> | AsyncIterator<T>)[] = [];
  for (const contender of contenders) {
    if (typeof (contender as any)[Symbol.asyncIterator] === "function") {
      iters.push((contender as AsyncIterable<T>)[Symbol.asyncIterator]());
    } else if (typeof (contender as any)[Symbol.iterator] === "function") {
      iters.push((contender as Iterable<T>)[Symbol.iterator]());
    } else {
      /* eslint-disable require-yield */
      const iter: AsyncIterator<T> = (async function*() {
        return contender as T;
      })();
      /* eslint-enable require-yield */
      iters.push(iter);
    }
  }
  return iters;
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
  const iters = iterators(contenders);
  // We use a finally block to ensure that return is called on every iterator.
  try {
    while (true) {
      const result = await Promise.race(iters.map((iter) => iter.next()));
      if (result.done) {
        return result.value;
      }
      yield result.value;
    }
  } finally {
    await Promise.race(
      iters.map((iter) => {
        if (iter.return != null) {
          return iter.return();
        }
        return { value: undefined, done: true };
      }),
    );
  }
}
