const sentinel = "VALUE";

interface TrieNode<T> {
  [key: string]: TrieNode<T>;
}

export default class Trie<T> {
  private root: TrieNode<T>;
  private _size: number;
  constructor() {
    this.root = {
      children: {},
    };
    this._size = 0;
  }

  public get size() {
    return this._size;
  }

  /**
   * Set a prefix in the trie to a value
   * @param prefix the prefix to set in the trie
   * @param value the value to set on the prefix
   */
  public set(prefix: string, value: T) {
    let node = this.root;
    let token: string;

    // for each token in the word create a new node or set the token
    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      node = node[token] || (node[token] = {});
    }

    if (!(sentinel in node)) {
      this._size++;
    }

    // set the sentinel to be the value
    node[sentinel] = value as any;
  }

  /**
   * Get a value associated with a prefix in the trie or undefined if no
   * value is associated with the prefix.
   * @param prefix the prefix to get from the trie
   */
  public get(prefix: string): T | undefined {
    let node = this.root;
    let token: string;

    // iterate over tokens
    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      node = node[token];
      // if we fall off the trie return undefined
      if (node === undefined) {
        return undefined;
      }
    }

    // if no sentinel return undefined (in tree but not a full word)
    if (!(sentinel in node)) {
      return;
    }

    // otherwise return the value
    return (node[sentinel] as unknown) as T;
  }

  /**
   * Check to see if a prefix is contains in the trie
   * @param prefix the prefix to check in the trie
   */
  public has(prefix: string): boolean {
    let node = this.root;
    let token: string;

    // iterate over tokens
    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      node = node[token];
      // if we fall off the trie return undefined
      if (node === undefined) {
        return false;
      }
    }

    // return true if the found node has a sentinel
    return sentinel in node;
  }

  public clear() {
    this.root = {};
    this._size = 0;
  }

  public delete(prefix: string): boolean {
    let node = this.root;
    let token: string;
    let parent: TrieNode<T>;
    let toPrune: TrieNode<T> | null = null;
    let tokenToPrune: string | null = null;

    // iterate over the node's children
    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      parent = node;
      node = node[token];

      // Prefix does not exist
      if (node === undefined) {
        return false;
      }

      // Keeping track of a potential branch to prune
      if (toPrune !== null) {
        if (Object.keys(node).length > 1) {
          toPrune = null;
          tokenToPrune = null;
        }
      } else {
        if (Object.keys(node).length < 2) {
          toPrune = parent;
          tokenToPrune = token;
        }
      }
    }

    if (!(sentinel in node)) {
      return false;
    }

    this._size--;

    if (toPrune && tokenToPrune) {
      delete toPrune[tokenToPrune];
    } else {
      delete node[sentinel];
    }

    return true;
  }

  public *find(prefix: string): Generator<{ prefix: string; value: T }> {
    let node = this.root;
    let token: string;

    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      node = node[token];

      if (node === undefined) {
        return;
      }
    }

    // Performing DFS from prefix
    let nodeStack: TrieNode<T>[] = [node];
    let prefixStack: string[] = [prefix];
    let k: string;

    // while there are nodes to look at
    while (nodeStack.length) {
      // get a node
      prefix = prefixStack.pop()!;
      node = nodeStack.pop()!;

      // iterate over its direct children
      for (k in node) {
        // if we find a sentinel its a match yay
        if (k === sentinel) {
          yield { prefix, value: (node[sentinel] as unknown) as T };
          continue;
        }

        // add the child to our stack
        nodeStack.push(node[k]);
        prefixStack.push(prefix + k);
      }
    }
  }

  public *findValues(prefix: string): Generator<T> {
    let node = this.root;
    let token: string;

    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      node = node[token];

      if (node === undefined) {
        return;
      }
    }

    // Performing DFS from prefix
    let nodeStack: TrieNode<T>[] = [node];
    let prefixStack: string[] = [prefix];
    let k: string;

    // while there are nodes to look at
    while (nodeStack.length) {
      // get a node
      prefix = prefixStack.pop()!;
      node = nodeStack.pop()!;

      // iterate over its direct children
      for (k in node) {
        // if we find a sentinel its a match yay
        if (k === sentinel) {
          yield (node[sentinel] as unknown) as T;
          continue;
        }

        // add the child to our stack
        nodeStack.push(node[k]);
        prefixStack.push(prefix + k);
      }
    }
  }
}
