class Stack<T> {
  private _stack: T[];
  constructor() {
    this._stack = [];
  }

  /**
   * Push a value onto the stack and return the new size of the stack
   *
   * O(1)
   * @param value the value to add to the stack.
   * @returns the new size of the stack.
   */
  push(value: T): number {
    return this._stack.push(value);
  }

  /**
   * Pop a value from the stack and return it. Returns undefined if empty.
   *
   * O(1)
   * @returns the top value from the stack or undefined if the stack is empty.
   */
  pop(): T | undefined {
    return this._stack.pop();
  }

  /**
   * Return the top value from the stack without removing it. Returns undefined
   * if the stack is empty.
   *
   * O(1)
   * @returns the top value from the stack or undefined if the stack is empty.
   */
  peek(): T | undefined {
    if (this.length === 0) {
      return undefined;
    }
    return this._stack[this.length - 1];
  }

  /**
   * Remove all elements from the stack.
   *
   * O(1)
   */
  clear(): void {
    this._stack = [];
  }

  /**
   * Return the current number of elements in the stack.
   *
   * O(1).
   */
  get length(): number {
    return this._stack.length;
  }
}

export default Stack;
