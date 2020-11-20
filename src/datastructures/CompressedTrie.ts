/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import longestCommonPrefix from "../util/longestCommonPrefix";
import objectHasOneProperty from "../util/objectHasOneProperty";
import objectIsEmpty from "../util/objectIsEmpty";

const SENTINEL = Symbol("SENTINEL");

interface CompressedTrieNode<T> {
  [key: string]: CompressedTrieNode<T> | undefined;
  [SENTINEL]?: T;
}

export default class CompressedTrie<T> {
  private _size: number;
  private root: CompressedTrieNode<T>;
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

    // edge case we got to a node we already saved
    if (keySuffix.length === 0) {
      node[SENTINEL] = value;
      return;
    }

    // check to see if any edge has shares a prefix with the key
    let nextEdge: string | undefined;
    for (const edge in node) {
      if (keySuffix.startsWith(edge)) {
        nextEdge = edge;
        break;
      }
    }

    // if some edge shares a prefix
    if (nextEdge !== undefined) {
      const commonPrefix = longestCommonPrefix(nextEdge, keySuffix);
      const nextSuffix = nextEdge.slice(commonPrefix.length);
      keySuffix = keySuffix.slice(commonPrefix.length);
      // create a node for the common prefix
      node[commonPrefix] = {};
      // add the shared edge back
      node[commonPrefix]![nextSuffix] = node[nextEdge];
      // add the new value
      node[commonPrefix]![keySuffix] = { [SENTINEL]: value };
      // delete the old edge
      delete node[nextEdge];
    } else {
      // no common prefix so add the value to the node
      node[keySuffix] = { [SENTINEL]: value };
    }
    this._size++;
  }

  /**
   * Get a value associated with a key in the trie or undefined if no
   * value is associated with the key.
   * @param key the key to get from the trie
   */
  public get(key: string): T | undefined {
    const { node, keySuffix } = this.traverseForKey(key);
    if (keySuffix.length === 0 && this.nodeContainsValue(node)) {
      return node[SENTINEL];
    }
    return undefined;
  }

  /**
   * Check to see if a key is contained in the trie
   * @param key the key to check in the trie
   */
  public has(key: string): boolean {
    const { node, keySuffix } = this.traverseForKey(key);
    return keySuffix.length === 0 && this.nodeContainsValue(node);
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
    const {
      node,
      keySuffix,
      nodeEdge,
      parent,
      grandparent,
      parentEdge,
    } = this.traverseForKey(key);
    // if we found the node
    if (keySuffix.length !== 0 && this.nodeContainsValue(node)) {
      // remove the key
      delete node[SENTINEL];

      // if the node is empty delete it
      if (
        objectIsEmpty(node) &&
        parent !== undefined &&
        nodeEdge !== undefined
      ) {
        // delete the node from the parent
        delete parent[nodeEdge];

        // if the parent has one child and does not contain a value
        // then remove the parent and attach the child to the grandparent
        if (
          objectHasOneProperty(parent) &&
          grandparent !== undefined &&
          parentEdge !== undefined &&
          !this.nodeContainsValue(parent)
        ) {
          for (const edge in parent) {
            grandparent[parentEdge + edge] = parent[edge];
            delete grandparent[parentEdge];
          }
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
  public *find(prefix: string): Generator<{ key: string; value: T }> {
    let { node, keyPrefix } = this.traverseForKey(prefix);

    // Performing DFS from prefix
    const nodeStack: Array<CompressedTrieNode<T>> = [node];
    const keyStack: string[] = [keyPrefix];
    let edge: string;

    // while there are nodes to look at
    while (nodeStack.length !== 0) {
      prefix = keyStack.pop()!;
      node = nodeStack.pop()!;

      // iterate over its direct children
      for (edge in node) {
        nodeStack.push(node[edge]!);
        keyStack.push(prefix + edge);
      }
      if (SENTINEL in node) {
        yield { key: prefix, value: node[SENTINEL]! };
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

  private nodeContainsValue(node: CompressedTrieNode<T>): boolean {
    return SENTINEL in node;
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
    // the parent of the node
    parent?: CompressedTrieNode<T>;
    // the grandparent of the node
    grandparent?: CompressedTrieNode<T>;
    // the edge used to traverse from the parent to the node
    nodeEdge?: string;
    // the edge used to traverse from the grandparent to the node
    parentEdge?: string;
  } {
    let node: CompressedTrieNode<T> = this.root;
    let parent: CompressedTrieNode<T> | undefined;
    let grandparent: CompressedTrieNode<T> | undefined;
    let keyPrefix = "";
    let keySuffix = key;
    let nodeEdge: string | undefined;
    let parentEdge: string | undefined;

    // traverse until value is found or impossible to continue
    while (keySuffix.length > 0) {
      // find the next edge to explore
      let nextEdge: string | undefined;
      for (const edge in node) {
        if (keySuffix.startsWith(edge)) {
          nextEdge = edge;
          break;
        }
      }
      // if we found an edge then update
      if (nextEdge !== undefined) {
        grandparent = parent;
        parent = node;
        parentEdge = nodeEdge;
        nodeEdge = nextEdge;
        node = node[nextEdge] as CompressedTrieNode<T>;
        keySuffix = keySuffix.slice(nextEdge.length);
        keyPrefix += nextEdge;
      } else {
        // otherwise terminate the search
        break;
      }
    }

    return {
      grandparent,
      parent,
      node,
      keySuffix,
      keyPrefix,
      nodeEdge,
      parentEdge,
    };
  }
}
