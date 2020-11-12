class LinkedList<T> {
  private _tail: LinkedListNode<T> | undefined;
  private _head: LinkedListNode<T> | undefined;
  private _length: number;

  constructor(source?: Iterable<T>) {
    this._head = undefined;
    this._tail = undefined;
    this._length = 0;

    // if a source is passed set the list to the order of the source
    if (source !== undefined) {
      for (const value of source) {
        this.push(value);
      }
    }
  }

  /**
   * Add a value to the start of the list
   * @param value the value to add to the list
   */
  unshift(value: T): number {
    // create new head with next value set to prev head
    this._head = new LinkedListNode(value, undefined, this._head);
    // set back pointer on prev head
    if (this._head.next !== undefined) {
      this._head.next.prev = this._head;
    }
    if (this._tail === undefined) {
      this._tail = this._head;
    }
    this._length++;
    return this._length;
  }

  /**
   * Remove and Return the value from the start of the list
   */
  shift(): T | undefined {
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

  /**
   * Add a value to the end of the list
   * @param value the value to add to the list
   */
  push(value: T): number {
    this._tail = new LinkedListNode(value, this._tail, undefined);
    // set next pointer on prev tail
    if (this._tail.prev !== undefined) {
      this._tail.prev.next = this._tail;
    }
    if (this._head === undefined) {
      this._head = this._tail;
    }
    this._length++;
    return this._length;
  }

  /**
   * Remove and return a value from the end of the list
   */
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

  *[Symbol.iterator](): Generator<LinkedListNode<T>, void, void> {
    let node = this._head;
    while (node !== undefined) {
      yield node;
      node = node.next;
    }
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
