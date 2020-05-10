import LinkedList from "./LinkedList";

class Queue<T> {
  private readonly _linkedList: LinkedList<T>;

  constructor() {
    this._linkedList = new LinkedList<T>();
  }

  enqueue(value: T): number {
    return this._linkedList.push(value);
  }

  dequeue(): T | undefined {
    return this._linkedList.popStart();
  }

  isEmpty(): boolean {
    return this._linkedList.length === 0;
  }

  get length(): number {
    return this._linkedList.length;
  }
}

export default Queue;
