export type CompareFn<T> = (a: T, b: T) => number;

export function defaultCompareFn<T>(a: T, b: T): number {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
}
