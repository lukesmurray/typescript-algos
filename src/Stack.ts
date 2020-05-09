class Stack<T> {
  private readonly _stack: T[];
  constructor() {
    this._stack = [];
  }

  /**
   * Push a value onto the stack and return the new size of the stack O(1).
   * @param value the value to add to the stack.
   * @returns the new size of the stack.
   */
  push(value: T): number {
    return this._stack.push(value);
  }

  /**
   * Pop a value from the stack and return it. Returns undefined if empty. O(1).
   * @returns the top value from the stack or undefined if the stack is empty.
   */
  pop(): T | undefined {
    return this._stack.pop();
  }

  /**
   * Return whether or not the stack is empty. O(1).
   * @returns true if the stack is empty false otherwise.
   */
  isEmpty(): boolean {
    return this._stack.length === 0;
  }

  /**
   * Return the current number of elements in the stack. O(1).
   */
  get length(): number {
    return this._stack.length;
  }
}

export default Stack;
