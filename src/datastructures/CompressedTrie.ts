/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import longestCommonPrefix from "../util/longestCommonPrefix";
import objectHasOneProperty from "../util/objectHasOneProperty";

const VALUE = Symbol("Value");
const PARENT = Symbol("Parent");
const LEAF = Symbol("Leaf");

export interface CompletionTrieNode<T> {
  [key: string]: CompletionTrieNode<T> | undefined;
  [PARENT]?: CompletionTrieNode<T>;
  [LEAF]?: CompletionTrieNode<T>;

  // values used on leaves
  [VALUE]?: T;
}

export default class CompletionTrie<T> {
  private _size: number;
  public root: CompletionTrieNode<T>;
  constructor() {
    this._size = 0;
    this.root = {};
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
    let { node, keySuffix } = this.traverseForKey(key);

    // hit a leaf
    if (this.nodeIsLeaf(node)) {
      node[VALUE] = value;
      return;
    }

    // add a leaf to an existing node
    if (keySuffix.length === 0) {
      node[LEAF] = {
        [VALUE]: value,
        [PARENT]: node,
      };
      return;
    }

    // check to see if any edge has shares a prefix with the key
    let commonPrefix: string | undefined;
    let nextEdge: string | undefined;
    for (const edge in node) {
      commonPrefix = longestCommonPrefix(keySuffix, edge);
      if (commonPrefix.length > 0) {
        nextEdge = edge;
        break;
      }
    }

    // if some edge shares a prefix
    if (nextEdge !== undefined && commonPrefix !== undefined) {
      const nextSuffix = nextEdge.slice(commonPrefix.length);
      keySuffix = keySuffix.slice(commonPrefix.length);
      // create a node for the common prefix
      // the score is the score of it's only child nextEdge
      node[commonPrefix] = {
        [PARENT]: node,
      };
      // add the edge with the shared prefix back
      node[commonPrefix]![nextSuffix] = node[nextEdge];
      // set the parent of the edge with the shared prefix
      node[commonPrefix]![nextSuffix]![PARENT] = node[commonPrefix];
      let leaf: CompletionTrieNode<T>;
      if (keySuffix.length !== 0) {
        // add the new string to the common prefix node
        node[commonPrefix]![keySuffix] = {
          [PARENT]: node[commonPrefix],
        };
        leaf = {
          [PARENT]: node[commonPrefix]![keySuffix],
          [VALUE]: value,
        };
        // set the leaf
        node[commonPrefix]![keySuffix]![LEAF] = leaf;
      } else {
        leaf = {
          [PARENT]: node[commonPrefix],
          [VALUE]: value,
        };
        // add the new string to the common prefix node
        node[commonPrefix]![LEAF] = leaf;
      }
      // delete the old edge
      delete node[nextEdge];
    } else {
      // no common prefix so add the as a new string
      node[keySuffix] = { [PARENT]: node };
      node[keySuffix]![LEAF]! = {
        [VALUE]: value,
        [PARENT]: node[keySuffix],
      };
    }
    this._size++;
  }

  /**
   * Get a value associated with a key in the trie or undefined if no
   * value is associated with the key.
   * @param key the key to get from the trie
   */
  public get(key: string): T | undefined {
    const { node } = this.traverseForKey(key);
    if (this.nodeIsLeaf(node)) {
      return node[VALUE];
    }
    return undefined;
  }

  /**
   * Check to see if a key is contained in the trie
   * @param key the key to check in the trie
   */
  public has(key: string): boolean {
    const { node } = this.traverseForKey(key);
    return this.nodeIsLeaf(node);
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
    const { node, parentEdge } = this.traverseForKey(key);
    // if we found the node
    if (this.nodeIsLeaf(node)) {
      const parent = node[PARENT]!;
      delete parent[LEAF];

      const grandparent = parent[PARENT];
      // if parent has one child place child on grandparent and remove parent
      if (
        objectHasOneProperty(parent) &&
        grandparent !== undefined &&
        parentEdge !== undefined
      ) {
        for (const child in parent) {
          grandparent[parentEdge + child] = parent[child];
          delete grandparent[parentEdge];
        }
      }

      this._size--;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Find all values in the trie which start with the prefix
   * @param prefix the prefix to search for in the trie.
   */
  public *find(prefix: string): Generator<T> {
    let { node } = this.traverseForKey(prefix);

    // Performing DFS from prefix
    const nodeStack: Array<CompletionTrieNode<T>> = [node];
    let edge: string;

    // while there are nodes to look at
    while (nodeStack.length !== 0) {
      node = nodeStack.pop()!;

      // iterate over its direct children
      for (edge in node) {
        nodeStack.push(node[edge]!);
      }

      if (LEAF in node) {
        yield node[LEAF]![VALUE]!;
      }
    }
  }

  private nodeIsLeaf(node: CompletionTrieNode<T>): boolean {
    return VALUE in node;
  }

  /**
   * Traverse the trie as far as possible for the given key
   * @param key the search to traverse for
   * @returns the node traversed to, the prefix used to get to the node, the suffix left of the key
   */
  private traverseForKey(
    key: string
  ): {
    // the traversed node (as far as we could get without falling off or following a bad node)
    node: CompletionTrieNode<T>;
    // the remaining suffix of the key still left to traverse
    keySuffix: string;
    // the prefix of the key used so far
    keyPrefix: string;
    // the edge used to traverse from the parent to the node
    nodeEdge?: string | typeof LEAF;
    // the edge used to traverse from the grandparent to the node
    parentEdge?: string;
  } {
    let node: CompletionTrieNode<T> = this.root;
    let keyPrefix = "";
    let keySuffix = "";
    let nodeEdge: string | undefined | typeof LEAF;
    let parentEdge: string | undefined;
    let charactersFound: number = 0;

    // traverse until value is found or impossible to continue
    while (charactersFound < key.length) {
      // find the next edge to explore
      let nextEdge: string | undefined;
      for (const edge in node) {
        if (
          key.slice(charactersFound, charactersFound + edge.length) === edge
        ) {
          nextEdge = edge;
          break;
        }
      }
      // if we found an edge then update
      if (nextEdge !== undefined) {
        parentEdge = nodeEdge as string;
        nodeEdge = nextEdge;
        node = node[nextEdge] as CompletionTrieNode<T>;
        charactersFound += nextEdge.length;
      } else {
        // otherwise terminate the search
        break;
      }
    }

    keySuffix = key.slice(charactersFound);
    keyPrefix = key.slice(0, charactersFound);

    if (keySuffix.length === 0 && node[LEAF] !== undefined) {
      node = node[LEAF]!;
      parentEdge = nodeEdge as string;
      nodeEdge = LEAF;
    }

    return {
      node,
      keySuffix,
      keyPrefix,
      nodeEdge,
      parentEdge,
    };
  }
}
