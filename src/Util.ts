export type CompareFn<T> = (a: T, b: T) => number;

export function getCompareFnOrDefault<T>(
  compareFn: CompareFn<T> | undefined
): (a: T, b: T) => number {
  return compareFn ?? ((a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0));
}
