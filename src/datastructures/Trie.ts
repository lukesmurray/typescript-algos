/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-dynamic-delete */

const SENTINEL = "VALUE" as const;

interface TrieNode<T> {
  [key: string]: TrieNode<T> | undefined;
}

export default class Trie<T> {
  private root: TrieNode<T>;
  private _size: number;
  constructor() {
    this.root = {};
    this._size = 0;
  }

  public get size(): number {
    return this._size;
  }

  /**
   * Set a key in the trie to a value
   * @param key the key to set in the trie
   * @param value the value to set on the prefix
   */
  public set(key: string, value: T): void {
    let node: TrieNode<T> | undefined = this.root;
    let token: string;

    // for each token in the word create a new node or set the token
    for (let i = 0, l = key.length; i < l; i++) {
      token = key[i];
      node = node[token] ?? (node[token] = {});
    }

    if (!(SENTINEL in node)) {
      this._size++;
    }

    // set the sentinel to be the value
    node[SENTINEL] = value as any;
  }

  /**
   * Get a value associated with a key in the trie or undefined if no
   * value is associated with the key.
   * @param key the key to get from the trie
   */
  public get(key: string): T | undefined {
    let node: TrieNode<T> | undefined = this.root;
    let token: string;

    // iterate over tokens
    for (let i = 0, l = key.length; i < l; i++) {
      token = key[i];
      node = node[token];
      // if we fall off the trie return undefined
      if (node === undefined) {
        return undefined;
      }
    }

    // if no sentinel return undefined (in tree but not a full word)
    if (!(SENTINEL in node)) {
      return;
    }

    // otherwise return the value
    return node[SENTINEL] as any;
  }

  /**
   * Check to see if a key is contained in the trie
   * @param key the key to check in the trie
   */
  public has(key: string): boolean {
    let node: TrieNode<T> | undefined = this.root;
    let token: string;

    // iterate over tokens
    for (let i = 0, l = key.length; i < l; i++) {
      token = key[i];
      node = node[token];
      // if we fall off the trie return undefined
      if (node === undefined) {
        return false;
      }
    }

    // return true if the found node has a sentinel
    return SENTINEL in node;
  }

  /**
   * Empty the trie
   */
  public clear(): void {
    this.root = {};
    this._size = 0;
  }

  /**
   * Delete a key from the trie. Returns true if the key is in the trie.
   * @param key the key to delete in the trie
   */
  public delete(key: string): boolean {
    let node: TrieNode<T> | undefined = this.root;
    let token: string;
    let parent: TrieNode<T>;
    let toPrune: TrieNode<T> | null = null;
    let tokenToPrune: string | null = null;

    // iterate over the node's children
    for (let i = 0, l = key.length; i < l; i++) {
      token = key[i];
      parent = node;
      node = node[token];

      // Prefix does not exist
      if (node === undefined) {
        return false;
      }

      // Keeping track of a potential branch to prune
      if (toPrune !== null) {
        if (this.numChildren(node) > 1) {
          toPrune = null;
          tokenToPrune = null;
        }
      } else {
        if (this.numChildren(node) < 2) {
          toPrune = parent;
          tokenToPrune = token;
        }
      }
    }

    if (!(SENTINEL in node)) {
      return false;
    }

    this._size--;

    if (toPrune !== null && tokenToPrune !== null) {
      delete toPrune[tokenToPrune];
    } else {
      delete node[SENTINEL];
    }

    return true;
  }

  /**
   * Find all values in the trie which start with the prefix
   * @param prefix the prefix to search for in the trie.
   */
  public *find(prefix: string): Generator<{ key: string; value: T }> {
    let node: TrieNode<T> | undefined = this.root;
    let token: string;

    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      node = node[token];

      if (node === undefined) {
        return;
      }
    }

    // Performing DFS from prefix
    const nodeStack: Array<TrieNode<T>> = [node];
    const keyStack: string[] = [prefix];
    let k: string;

    // while there are nodes to look at
    while (nodeStack.length !== 0) {
      prefix = keyStack.pop()!;
      node = nodeStack.pop()!;

      // iterate over its direct children
      for (k in node) {
        // if we find a sentinel its a match yay
        if (k === SENTINEL) {
          yield { key: prefix, value: node[SENTINEL] as any };
          continue;
        }

        // add the child to our stack
        nodeStack.push(node[k]!);
        keyStack.push(prefix + k);
      }
    }
  }

  /**
   * Find all values in the trie which start with the prefix
   * @param prefix the prefix to search for in the trie.
   */
  public *findValues(prefix: string): Generator<T> {
    for (const node of this.find(prefix)) {
      yield node.value;
    }
  }

  private numChildren(node: TrieNode<T>): number {
    let childrenCount = 0;
    for (const key in node) {
      if (key.length === 1) {
        childrenCount++;
      }
    }
    return childrenCount;
  }
}
