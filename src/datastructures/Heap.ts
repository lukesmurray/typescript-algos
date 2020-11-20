import { CompareFn, defaultCompareFn } from "./Util";

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
    this._compareFn = compareFn ?? defaultCompareFn;
  }

  peek(): T | undefined {
    return this.length > 0 ? this._data[0] : undefined;
  }

  removeRoot(): T | undefined {
    if (this.length === 0) {
      return undefined;
    }

    const root = this._data[0];
    // place the last element at the root position
    const last = this._data.pop();
    // the last element may not exist (or it may have been the first element)
    if (this._data.length !== 0 && last !== undefined) {
      this._data[0] = last;
    }
    Heap.heapify(this, 0);
    return root;
  }

  add(value: T): number {
    // add the value as the last child
    this._data.push(value);
    let i = this.length - 1;
    // while the value is not the root, and the parent of the value is larger
    // than the value. float the value up by swapping with its parent
    while (
      i > 0 &&
      this._compareFn(this._data[Heap.parent(i)], this._data[i]) > 0
    ) {
      [this._data[i], this._data[Heap.parent(i)]] = [
        this._data[Heap.parent(i)],
        this._data[i],
      ];
      i = Heap.parent(i);
    }
    return this.length;
  }

  get length(): number {
    return this._data.length;
  }

  empty(): boolean {
    return this._data.length === 0;
  }

  private static heapify<T>(heap: Heap<T>, i: number): void {
    // assume left is a valid heap
    const left = Heap.left(i);
    // assume right is a valid heap
    const right = Heap.right(i);
    let newRoot = -1;
    // if left is smaller then make left the new root
    if (
      left < heap.length &&
      heap._compareFn(heap._data[left], heap._data[i]) < 0
    ) {
      newRoot = left;
    } else {
      newRoot = i;
    }
    // if right is smaller make right the new root
    if (
      right < heap.length &&
      heap._compareFn(heap._data[right], heap._data[newRoot]) < 0
    ) {
      newRoot = right;
    }
    // if the root has changed then swap i with the new root
    if (newRoot !== i) {
      [heap._data[i], heap._data[newRoot]] = [
        heap._data[newRoot],
        heap._data[i],
      ];
      Heap.heapify(heap, newRoot);
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
