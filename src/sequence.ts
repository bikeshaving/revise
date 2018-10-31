export interface Sequence<T, U> {
  length: number;
  slice(this: T, start?: number, end?: number): T;
  concat(this: T, ...items: U[]): T;
}
