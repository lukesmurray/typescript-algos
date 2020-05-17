import { CompareFn, getCompareFnOrDefault } from "./Util";

class Heap<T> {
  private readonly _data: T[];
  private readonly _compareFn: CompareFn<T>;
  /**
   *
   * @param compareFn Function used to determine the order of the elements.
   *  It is expected to return a negative value if first argument is less than
   *  second argument, zero if they're equal and a positive value otherwise.
   *  If omitted, the elements are sorted in ascending order using < and >
   *  operators.
   */
  constructor(compareFn?: CompareFn<T>) {
    this._data = [];
    this._compareFn = getCompareFnOrDefault(compareFn);
  }

  max(): T | undefined {
    return this.length > 0 ? this._data[0] : undefined;
  }

  extractMax(): T | undefined {
    if (this.length === 0) {
      return undefined;
    }

    const max = this._data[0];
    const last = this._data.pop();
    if (this._data.length !== 0 && last !== undefined) {
      this._data[0] = last;
    }
    Heap.maxHeapify(this, 0);
    return max;
  }

  insert(value: T): number {
    this._data.push(value);
    let i = this.length - 1;
    while (
      i > 0 &&
      this._compareFn(this._data[Heap.parent(i)], this._data[i]) < 0
    ) {
      const tmp = this._data[i];
      this._data[i] = this._data[Heap.parent(i)];
      this._data[Heap.parent(i)] = tmp;
      i = Heap.parent(i);
    }
    return this.length;
  }

  get length(): number {
    return this._data.length;
  }

  private static maxHeapify<T>(heap: Heap<T>, i: number): void {
    const left = Heap.left(i);
    const right = Heap.right(i);
    let largest = -1;
    const compareLeftWithI = heap._compareFn(heap._data[left], heap._data[i]);
    if (left <= heap.length && compareLeftWithI > 0) {
      largest = left;
    } else {
      largest = i;
    }
    const compareRightWithLargest = heap._compareFn(
      heap._data[right],
      heap._data[largest]
    );
    if (right <= heap.length && compareRightWithLargest > 0) {
      largest = right;
    }
    if (largest !== i) {
      const tmp = heap._data[i];
      heap._data[i] = heap._data[largest];
      heap._data[largest] = tmp;
      Heap.maxHeapify(heap, largest);
    }
  }

  private static parent(index: number): number {
    return Math.floor(index / 2);
  }

  private static left(index: number): number {
    return 2 * index;
  }

  private static right(index: number): number {
    return 2 * index + 1;
  }
}

export default Heap;
