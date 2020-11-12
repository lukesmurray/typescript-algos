import LinkedList from "./LinkedList";

class Queue<T> {
  private readonly _linkedList: LinkedList<T>;

  constructor(source?: Iterable<T>) {
    this._linkedList = new LinkedList<T>(source);
  }

  enqueue(value: T): number {
    return this._linkedList.push(value);
  }

  dequeue(): T | undefined {
    return this._linkedList.shift();
  }

  get length(): number {
    return this._linkedList.length;
  }

  isEmpty(): boolean {
    return this._linkedList.length === 0;
  }
}

export default Queue;
