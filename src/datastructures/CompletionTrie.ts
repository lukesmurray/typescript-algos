/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import longestCommonPrefix from "../util/longestCommonPrefix";
import objectHasOneProperty from "../util/objectHasOneProperty";
import Heap from "./Heap";

const VALUE = Symbol("Value");
const RANKING = Symbol("Ranking");
const PARENT = Symbol("Parent");
const LEAF = Symbol("Leaf");

interface CompletionTrieNode<T> {
  [key: string]: CompletionTrieNode<T> | undefined;
  [PARENT]?: CompletionTrieNode<T>;
  [LEAF]?: CompletionTrieNode<T>;

  [VALUE]?: T;
  [RANKING]?: number;
}

export default class CompletionTrie<T> {
  private _size: number;
  private root: CompletionTrieNode<T>;
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
  public set(key: string, value: T, score: number): void {
    let { node, keySuffix } = this.traverseForKey(key);

    // hit a leaf
    if (this.nodeIsLeaf(node)) {
      node[VALUE] = value;
      this.setScore(node, score);
      return;
    }

    // add a leaf to an existing node
    if (keySuffix.length === 0) {
      node[LEAF] = {
        [VALUE]: value,
        [PARENT]: node,
      };
      this.setScore(node[LEAF]!, score);
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
      // the score is the score of it's only child nextEdge
      node[commonPrefix] = {
        [PARENT]: node,
        [RANKING]: node[nextEdge]![RANKING],
      };
      // add the edge with the shared prefix back
      node[commonPrefix]![nextSuffix] = node[nextEdge];
      // set the parent of the edge with the shared prefix
      node[commonPrefix]![nextSuffix]![PARENT] = node[commonPrefix];
      // add the new string to the common prefix node
      node[commonPrefix]![keySuffix] = {
        [PARENT]: node[commonPrefix],
      };
      // set the leaf
      node[commonPrefix]![keySuffix]![LEAF] = {
        [PARENT]: node[commonPrefix]![keySuffix],
        [VALUE]: value,
      };
      this.setScore(node[commonPrefix]![keySuffix]![LEAF]!, score);
      // delete the old edge
      delete node[nextEdge];
    } else {
      // no common prefix so add the as a new string
      node[keySuffix] = { [PARENT]: node };
      node[keySuffix]![LEAF]! = {
        [VALUE]: value,
        [PARENT]: node[keySuffix],
      };
      this.setScore(node[keySuffix]![LEAF]!, score);
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

      let lowestNode = parent;

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
          lowestNode = grandparent[parentEdge + child]!;
        }
      }

      this.setScore(lowestNode, this.nodeMaxValue(lowestNode));

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
    const nodeStack: Array<CompletionTrieNode<T>> = [node];
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
      if (LEAF in node) {
        yield { key: prefix, value: node[LEAF]![VALUE]! };
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

  public *topK(prefix: string, k?: number): Generator<T> {
    k = k ?? Number.POSITIVE_INFINITY;
    let { node } = this.traverseForKey(prefix);
    // we don't want to start with a leaf just in case there are other
    // children
    if (this.nodeIsLeaf(node)) {
      node = node[PARENT]!;
    }
    const heap = new Heap<CompletionTrieNode<T>>((a, b) => {
      if (a[RANKING]! > b[RANKING]!) {
        return -1;
      } else if (a[RANKING]! < b[RANKING]!) {
        return 1;
      } else {
        return 0;
      }
    });
    heap.add(node);

    let found = 0;
    while (!heap.empty() && found < k) {
      node = heap.removeRoot()!;
      if (this.nodeIsLeaf(node)) {
        yield node[VALUE]!;
        found++;
      } else {
        for (const child in node) {
          heap.add(node[child]!);
        }
        if (LEAF in node) {
          heap.add(node[LEAF]!);
        }
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
    let keySuffix = key;
    let nodeEdge: string | undefined | typeof LEAF;
    let parentEdge: string | undefined;

    // traverse until value is found or impossible to continue
    while (keySuffix.length !== 0) {
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
        parentEdge = nodeEdge as string;
        nodeEdge = nextEdge;
        node = node[nextEdge] as CompletionTrieNode<T>;
        keySuffix = keySuffix.slice(nextEdge.length);
        keyPrefix += nextEdge;
      } else {
        // otherwise terminate the search
        break;
      }
    }

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

  private setScore(node: CompletionTrieNode<T>, score: number): void {
    // set the score on the node
    node[RANKING] = score;

    let newMax = score;

    // update the parents
    let parent = node[PARENT];
    while (parent !== undefined) {
      const currentMax = parent[RANKING];

      // if the new max is larger than the current max
      // simply increment all the parent maxes until we reach a parent
      // that is larger or equal to the new max
      if (currentMax === undefined || newMax > currentMax) {
        while (parent !== undefined) {
          if (parent[RANKING] === undefined || newMax > parent[RANKING]!) {
            parent[RANKING] = newMax;
            parent = parent[PARENT];
          } else {
            parent = undefined;
          }
        }
        // if new max is equal to current max then do nothing
      } else if (newMax === currentMax) {
        parent = undefined;
      } else {
        // the new max is smaller than the parent max, two options
        // 1. we removed the current max
        // 2. our new value is less than the current max

        newMax = this.nodeMaxValue(parent);
        // handle option 2, parent max stays the same
        if (newMax === currentMax) {
          parent = undefined;
        } else {
          // handle option1, decrement the parent max and iterate up the tree
          // decrement the parent max
          parent[RANKING] = newMax;
          // iterate up the tree
          parent = parent[PARENT];
        }
      }
    }
  }

  private nodeMaxValue(node: CompletionTrieNode<T>): number {
    let newMax = Number.NEGATIVE_INFINITY;
    for (const child in node) {
      if (
        node[child]![RANKING] !== undefined &&
        node[child]![RANKING]! > newMax
      ) {
        newMax = node[child]![RANKING]!;
      }
    }
    if (node[LEAF]?.[RANKING] !== undefined && node[LEAF]![RANKING]! > newMax) {
      newMax = node[LEAF]![RANKING]!;
    }
    return newMax;
  }
}
