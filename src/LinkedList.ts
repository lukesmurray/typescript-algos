class LinkedList<T> {
  private _tail: LinkedListNode<T> | undefined;
  private _head: LinkedListNode<T> | undefined;
  private _length: number;
  constructor() {
    this._head = undefined;
    this._tail = undefined;
    this._length = 0;
  }

  pushStart(value: T): number {
    // create new head with next value set to prev head
    this._head = new LinkedListNode(value, undefined, this._head);
    // never undefined because we just set next on the head
    if (this._head.next !== undefined) {
      // set back pointer on prev head
      this._head.next.prev = this._head;
    }
    if (this._tail === undefined) {
      this._tail = this._head;
    }
    this._length++;
    return this._length;
  }

  popStart(): T | undefined {
    if (this._head === undefined) {
      return undefined;
    }
    const value = this._head.value;
    // increment the head
    this._head = this._head.next;
    // if the head went past the tail then set tail to undefined
    if (this._head === undefined) {
      this._tail = undefined;
    }
    this._length--;
    return value;
  }

  push(value: T): number {
    this._tail = new LinkedListNode(value, this._tail, undefined);
    // never undefined because we just set prev on the tail
    if (this._tail.prev !== undefined) {
      // set next pointer on prev tail
      this._tail.prev.next = this._tail;
    }
    if (this._head === undefined) {
      this._head = this._tail;
    }
    this._length++;
    return this._length;
  }

  pop(): T | undefined {
    if (this._tail === undefined) {
      return undefined;
    }
    const value = this._tail.value;
    // increment the head
    this._tail = this._tail.prev;
    // if the tail went past the head then set head to undefined
    if (this._tail === undefined) {
      this._head = undefined;
    }
    this._length--;
    return value;
  }

  get length(): number {
    return this._length;
  }

  isEmpty(): boolean {
    return this._length === 0;
  }
}

class LinkedListNode<T> {
  value: T;
  prev: LinkedListNode<T> | undefined;
  next: LinkedListNode<T> | undefined;

  constructor(
    value: T,
    prev: LinkedListNode<T> | undefined,
    next: LinkedListNode<T> | undefined
  ) {
    this.value = value;
    this.prev = prev;
    this.next = next;
  }
}

export default LinkedList;
