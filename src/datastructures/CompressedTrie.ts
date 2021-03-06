/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import longestCommonPrefix from "../util/longestCommonPrefix";
import objectHasOneProperty from "../util/objectHasOneProperty";

export const CompressedTrieValueKey = Symbol("Value");
const PARENT = Symbol("Parent");
export const CompressedTrieLeafKey = Symbol("Leaf");

export interface CompressedTrieNode<T> {
  [key: string]: CompressedTrieNode<T> | undefined;
  [PARENT]?: CompressedTrieNode<T>;
  [CompressedTrieLeafKey]?: CompressedTrieNode<T>;

  // values used on leaves
  [CompressedTrieValueKey]?: T;
}

export default class CompressedTrie<T> {
  private _size: number;
  public root: CompressedTrieNode<T>;
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
      node[CompressedTrieValueKey] = value;
      return;
    }

    // add a leaf to an existing node
    if (keySuffix.length === 0) {
      node[CompressedTrieLeafKey] = {
        [CompressedTrieValueKey]: value,
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
      let leaf: CompressedTrieNode<T>;
      if (keySuffix.length !== 0) {
        // add the new string to the common prefix node
        node[commonPrefix]![keySuffix] = {
          [PARENT]: node[commonPrefix],
        };
        leaf = {
          [PARENT]: node[commonPrefix]![keySuffix],
          [CompressedTrieValueKey]: value,
        };
        // set the leaf
        node[commonPrefix]![keySuffix]![CompressedTrieLeafKey] = leaf;
      } else {
        leaf = {
          [PARENT]: node[commonPrefix],
          [CompressedTrieValueKey]: value,
        };
        // add the new string to the common prefix node
        node[commonPrefix]![CompressedTrieLeafKey] = leaf;
      }
      // delete the old edge
      delete node[nextEdge];
    } else {
      // no common prefix so add the as a new string
      node[keySuffix] = { [PARENT]: node };
      node[keySuffix]![CompressedTrieLeafKey]! = {
        [CompressedTrieValueKey]: value,
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
      return node[CompressedTrieValueKey];
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
      delete parent[CompressedTrieLeafKey];

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
    const nodeStack: Array<CompressedTrieNode<T>> = [node];
    let edge: string;

    // while there are nodes to look at
    while (nodeStack.length !== 0) {
      node = nodeStack.pop()!;

      // iterate over its direct children
      for (edge in node) {
        nodeStack.push(node[edge]!);
      }

      if (CompressedTrieLeafKey in node) {
        yield node[CompressedTrieLeafKey]![CompressedTrieValueKey]!;
      }
    }
  }

  private nodeIsLeaf(node: CompressedTrieNode<T>): boolean {
    return CompressedTrieValueKey in node;
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
    node: CompressedTrieNode<T>;
    // the remaining suffix of the key still left to traverse
    keySuffix: string;
    // the prefix of the key used so far
    keyPrefix: string;
    // the edge used to traverse from the parent to the node
    nodeEdge?: string | typeof CompressedTrieLeafKey;
    // the edge used to traverse from the grandparent to the node
    parentEdge?: string;
  } {
    let node: CompressedTrieNode<T> = this.root;
    let keyPrefix = "";
    let keySuffix = "";
    let nodeEdge: string | undefined | typeof CompressedTrieLeafKey;
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
        node = node[nextEdge] as CompressedTrieNode<T>;
        charactersFound += nextEdge.length;
      } else {
        // otherwise terminate the search
        break;
      }
    }

    keySuffix = key.slice(charactersFound);
    keyPrefix = key.slice(0, charactersFound);

    if (keySuffix.length === 0 && node[CompressedTrieLeafKey] !== undefined) {
      node = node[CompressedTrieLeafKey]!;
      parentEdge = nodeEdge as string;
      nodeEdge = CompressedTrieLeafKey;
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
