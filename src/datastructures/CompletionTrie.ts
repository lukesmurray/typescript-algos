/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import jsonParseSerializedSymbols from "../util/jsonParseSerializedSymbols";
import longestCommonPrefix from "../util/longestCommonPrefix";
import objectHasOneProperty from "../util/objectHasOneProperty";
import {
  normalizeBuildOptions,
  RafBuildOptions,
  RafBuildOptionsWithoutRaf,
  RafBuildOptionsWithRaf,
} from "../util/RafBuildOptions";
import symbolToString from "../util/symbolToString";
import Heap from "./Heap";

const VALUES = Symbol.for("Values");
const VALUE = Symbol.for("Value");
const RANKING = Symbol.for("Ranking");
const PARENT = Symbol.for("Parent");
const LEAF = Symbol.for("Leaf");
const CHILDREN = Symbol.for("Children");
const CHILD_INDEX = Symbol.for("ChildIndex");

export interface CompletionTrieNode<T> {
  [key: string]: CompletionTrieNode<T> | undefined;
  [PARENT]?: CompletionTrieNode<T>;
  [LEAF]?: CompletionTrieNode<T>;
  [CHILDREN]?: Array<string | typeof LEAF>;

  // values used on leaves
  [VALUE]?: T;
  [RANKING]?: number;

  [VALUES]?: Array<[T, number]>;

  // values used in search
  [CHILD_INDEX]?: number;
}

export interface CompletionTrieMessage<T> {
  root: CompletionTrieNode<T>;
  size: number;
  allowCollisions: boolean;
}

export default class CompletionTrie<T> {
  private _size: number;
  private root: CompletionTrieNode<T>;
  private _allowCollisions: boolean;
  constructor(allowCollisions: boolean = false) {
    this._size = 0;
    this.root = {};
    this._allowCollisions = allowCollisions;
  }

  public get allowCollisions(): boolean {
    return this._allowCollisions;
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
    if (this.nodeIsLeaf(node) || this.nodeIsCollisionLeaf(node)) {
      if (this._allowCollisions) {
        this.convertLeafToCollisionLeaf(node);
      }

      if (this.nodeIsCollisionLeaf(node)) {
        node[VALUES]?.push([value, score]);
      } else {
        node[VALUE] = value;
      }

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
        [RANKING]: node[nextEdge]![RANKING],
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
      this.setScore(leaf, score);
      node[CHILDREN] = this.nodeSortedChildren(node);
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
    if (this.nodeIsCollisionLeaf(node)) {
      return node[VALUES]![0][0];
    }
    return undefined;
  }

  /**
   * Get array of values associated with a key in the trie or undefined if no
   * value is associated with the key.
   * @param key the key to get from the trie
   */
  public getArray(key: string): T[] | undefined {
    const { node } = this.traverseForKey(key);
    if (this.nodeIsLeaf(node)) {
      return [node[VALUE]!];
    }
    if (this.nodeIsCollisionLeaf(node)) {
      return node[VALUES]!.map((n) => n[0]);
    }
    return undefined;
  }

  /**
   * Check to see if a key is contained in the trie
   * @param key the key to check in the trie
   */
  public has(key: string): boolean {
    const { node } = this.traverseForKey(key);
    return this.nodeIsLeaf(node) || this.nodeIsCollisionLeaf(node);
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
    if (this.nodeIsLeaf(node) || this.nodeIsCollisionLeaf(node)) {
      const parent = node[PARENT]!;
      delete parent[LEAF];

      let lowestChangedNode = parent;

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
          lowestChangedNode = grandparent[parentEdge + child]!;
        }
      }

      this.setScore(lowestChangedNode, this.nodeMinValue(lowestChangedNode));

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
        const leaf = node[LEAF]!;
        if (this.nodeIsLeaf(leaf)) {
          yield { key: prefix, value: leaf[VALUE]! };
        } else if (this.nodeIsCollisionLeaf(leaf)) {
          for (const valueScore of leaf[VALUES]!) {
            yield { key: prefix, value: valueScore[0] };
          }
        }
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
    let node = this.locusForKey(prefix);

    // if we couldn't complete the prefix then we're done
    if (node === undefined) {
      return;
    }

    // we don't want to start with a leaf just in case there are other
    // children
    if (this.nodeIsLeaf(node) || this.nodeIsCollisionLeaf(node)) {
      node = node[PARENT]!;
    }

    const nodeHeap = new Heap<CompletionTrieNode<T>>(
      (a, b) => a[RANKING]! - b[RANKING]!
    );

    const valueHeap = new Heap<[T, number]>((a, b) => a[1]! - b[1]!);

    node = this.nodeFirstChild(node)!;
    nodeHeap.add(node);

    let found = 0;
    while ((!nodeHeap.empty() || !valueHeap.empty()) && found < k) {
      if (!nodeHeap.empty()) {
        node = nodeHeap.removeRoot()!;
        if (this.nodeIsLeaf(node)) {
          valueHeap.add([node[VALUE]!, node[RANKING]!]);
          // yield node[VALUE]!;
          // found++;
        } else if (this.nodeIsCollisionLeaf(node)) {
          for (const value of node[VALUES]!) {
            valueHeap.add(value);
          }
        } else {
          // add the first child to the queue
          const firstChild = this.nodeFirstChild(node);
          if (firstChild !== undefined) {
            nodeHeap.add(firstChild);
          }
        }
        // add the next sibling to the queue
        const sibling = this.nodeNextSibling(node);
        if (sibling !== undefined) {
          nodeHeap.add(sibling);
        }
      }
      if (!valueHeap.empty()) {
        const value = valueHeap.removeRoot();
        yield value![0];
        found++;
      }
    }
  }

  private nodeFirstChild(
    node: CompletionTrieNode<T>
  ): CompletionTrieNode<T> | undefined {
    // add the first child to the queue
    if (node[CHILDREN] !== undefined && node[CHILDREN]!.length > 0) {
      // give the first child a child index
      node[node[CHILDREN]![0]]![CHILD_INDEX] = 0;
      return node[node[CHILDREN]![0]];
    }
    return undefined;
  }

  private nodeNextSibling(
    node: CompletionTrieNode<T>
  ): CompletionTrieNode<T> | undefined {
    if (node[CHILD_INDEX] === undefined) {
      return undefined;
    }
    const parent = node[PARENT];
    const siblingChildIndex = node[CHILD_INDEX]! + 1;
    if (parent![CHILDREN]!.length > siblingChildIndex) {
      const sibling = parent![parent![CHILDREN]![siblingChildIndex]]!;
      sibling[CHILD_INDEX] = siblingChildIndex;
      return sibling;
    }
    return undefined;
  }

  private nodeIsLeaf(node: CompletionTrieNode<T>): boolean {
    return VALUE in node;
  }

  private nodeIsCollisionLeaf(node: CompletionTrieNode<T>): boolean {
    return VALUES in node;
  }

  private convertLeafToCollisionLeaf(node: CompletionTrieNode<T>): void {
    if (VALUE in node) {
      node[VALUES] = [[node[VALUE]!, node[RANKING]!]];
      delete node[VALUE];
    }
  }

  /**
   * Get the locus node, the highest node in the trie that matches or extends
   * the prefix string
   * @param prefix the prefix to the locus
   */
  private locusForKey(prefix: string): CompletionTrieNode<T> | undefined {
    const { node, keySuffix } = this.traverseForKey(prefix);

    // if keySuffix is non zero we still have some matching to do
    if (keySuffix.length > 0) {
      // return the first edge which extends keySuffix
      for (const edge in node) {
        if (edge.startsWith(keySuffix)) {
          return node[edge]!;
        }
      }
      // actually no match for prefix so we're done
      return undefined;
    } else {
      return node;
    }
  }

  /**
   * Traverse the trie as far as possible for the given key
   * @param key the search to traverse for
   * @returns the node traversed to, the prefix used to get to the node, the suffix left of the key
   */
  private traverseForKey(
    key: string
  ): {
    /**
     * the traversed node (as far as we could get without falling off or following a bad node)
     */
    node: CompletionTrieNode<T>;
    /**
     * the remaining suffix of the key still left to traverse
     */
    keySuffix: string;
    /**
     * the prefix of the key used so far
     */
    keyPrefix: string;
    /**
     * the edge used to traverse from the parent to the node
     */
    nodeEdge?: string | typeof LEAF;
    /**
     * the edge used to traverse from the grandparent to the node
     */
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

  private setScore(node: CompletionTrieNode<T>, score: number): void {
    let newMin = score;

    if (this.nodeIsCollisionLeaf(node)) {
      node[VALUES] = node[VALUES]!.sort((a, b) => a[1] - b[1]);
      node[RANKING] = Math.min(...node[VALUES]!.map((v) => v[1]));
      // new min is the ranking
      newMin = node[RANKING]!;
    } else {
      // set the score on the node
      node[RANKING] = score;
    }

    // if its not a leaf node then reset the children cause the score changed
    if (!this.nodeIsLeaf(node)) {
      node[CHILDREN] = this.nodeSortedChildren(node);
    }

    // update the parents
    let parent = node[PARENT];
    while (parent !== undefined) {
      const currentMin = parent[RANKING];

      // if the new min is smaller than the current min
      // simply decrement all the parents until we reach a parent
      // that is smaller or equal to the new min
      if (currentMin === undefined || newMin < currentMin) {
        while (parent !== undefined) {
          parent[CHILDREN] = this.nodeSortedChildren(parent);
          if (parent[RANKING] === undefined || newMin < parent[RANKING]!) {
            parent[RANKING] = newMin;
            parent = parent[PARENT];
          } else {
            parent = undefined;
          }
        }
        // if new min is equal to current min then do nothing
      } else if (newMin === currentMin) {
        parent[CHILDREN] = this.nodeSortedChildren(parent);
        parent = undefined;
      } else {
        parent[CHILDREN] = this.nodeSortedChildren(parent);
        // the new min is larger than the parent min, two options
        // 1. we removed or replaced the current min child
        // 2. our new value is greater than the current min child

        newMin = this.nodeMinValue(parent);
        // handle option 2, parent max stays the same
        if (newMin === currentMin) {
          parent = undefined;
        } else {
          // handle option1, increment the parent min and iterate up the tree
          parent[RANKING] = newMin;
          parent = parent[PARENT];
        }
      }
    }
  }

  private nodeSortedChildren(
    node: CompletionTrieNode<T>
  ): Array<string | typeof LEAF> {
    const keys: Array<string | typeof LEAF> = Object.keys(node);
    if (LEAF in node) {
      keys.push(LEAF);
    }
    keys.sort((a, b) => {
      if (node[a]![RANKING]! > node[b]![RANKING]!) {
        return 1;
      } else if (node[a]![RANKING]! < node[b]![RANKING]!) {
        return -1;
      } else {
        return 0;
      }
    });
    return keys;
  }

  private nodeMinValue(node: CompletionTrieNode<T>): number {
    let newMin = Number.POSITIVE_INFINITY;
    for (const child in node) {
      if (
        node[child]![RANKING] !== undefined &&
        node[child]![RANKING]! < newMin
      ) {
        newMin = node[child]![RANKING]!;
      }
    }
    if (node[LEAF]?.[RANKING] !== undefined && node[LEAF]![RANKING]! < newMin) {
      newMin = node[LEAF]![RANKING]!;
    }
    return newMin;
  }

  public toJSON(): string {
    return JSON.stringify({
      root: this.nodeToSerializableRecursive(this.root),
      _size: this._size,
    });
  }

  // converts node into a serializable object, note that parent links are lost
  private nodeToSerializableRecursive(node: CompletionTrieNode<T>): string {
    const result: any = {};
    for (const prop in node) {
      result[prop] = this.nodeToSerializableRecursive(node[prop]!);
    }

    if (LEAF in node) {
      result[symbolToString(LEAF)] = this.nodeToSerializableRecursive(
        node[LEAF]!
      );
    }
    if (CHILDREN in node) {
      result[symbolToString(CHILDREN)] = node[CHILDREN]?.map((v) => {
        if (typeof v === "symbol") {
          return symbolToString(v);
        }
        return v;
      });
    }
    if (VALUE in node) {
      result[symbolToString(VALUE)] = node[VALUE];
    }
    if (RANKING in node) {
      result[symbolToString(RANKING)] = node[RANKING];
    }
    if (CHILD_INDEX in node) {
      result[symbolToString(CHILD_INDEX)] = node[CHILD_INDEX];
    }

    return result;
  }

  public static fromJSON<T>(serializedTrie: string): CompletionTrie<T> {
    const data = jsonParseSerializedSymbols<{
      root: CompletionTrieNode<T>;
      _size: number;
    }>(serializedTrie);
    const trie = new CompletionTrie<T>();
    trie._size = data._size;
    trie.root = data.root;

    // add parent links back to the trie
    trie.addParentLinksRecursively(trie.root);

    return trie;
  }

  public toMessage(): CompletionTrieMessage<T> {
    this.removeParentLinksRecursively(this.root);
    this.removeSymbolsRecursively(this.root);
    return {
      root: this.root,
      size: this._size,
      allowCollisions: this._allowCollisions,
    };
  }

  public static fromMessage<T>(
    message: CompletionTrieMessage<T>,
    buildOptions?: RafBuildOptionsWithoutRaf
  ): CompletionTrie<T>;

  public static fromMessage<T>(
    message: CompletionTrieMessage<T>,
    buildOptions: RafBuildOptionsWithRaf
  ): Promise<CompletionTrie<T>>;

  public static fromMessage<T>(
    message: CompletionTrieMessage<T>,
    buildOptions?: RafBuildOptions
  ): CompletionTrie<T> | Promise<CompletionTrie<T>> {
    const trie = new CompletionTrie<T>();
    const normalizedBuildOptions = normalizeBuildOptions(buildOptions);

    trie._size = message.size;
    trie.root = message.root;
    trie._allowCollisions = message.allowCollisions;

    const nodeStack: Array<{
      node: CompletionTrieNode<T>;
      parent?: CompletionTrieNode<T>;
    }> = [{ node: trie.root }];

    const processNode = (): void => {
      const { node, parent } = nodeStack.pop()!;
      node[PARENT] = parent;
      trie.addSymbolsToNode(node);

      for (const childKey in node) {
        nodeStack.push({ node: node[childKey]!, parent: node });
      }
      if (LEAF in node) {
        nodeStack.push({ node: node[LEAF]!, parent: node });
      }
    };

    if (!normalizedBuildOptions.useRaf) {
      while (nodeStack.length !== 0) {
        processNode();
      }
      return trie;
    } else {
      return new Promise((resolve, reject) => {
        // process children using raf
        const processNodeStack = (taskStartTime: number): void => {
          // process children for maxMillisecondsPerFrame
          try {
            let taskFinishTime;
            do {
              if (nodeStack.length !== 0) {
                processNode();
              }
              taskFinishTime = performance.now();
            } while (
              nodeStack.length !== 0 &&
              taskFinishTime - taskStartTime <
                normalizedBuildOptions.maxMillisecondsPerFrame
            );

            // if done then return otherwise request another frame
            if (nodeStack.length !== 0) {
              requestAnimationFrame(processNodeStack);
            } else {
              resolve(trie);
            }
          } catch (err) {
            reject(err);
          }
        };
        requestAnimationFrame(processNodeStack);
      });
    }
  }

  private removeSymbolsRecursively(node: CompletionTrieNode<T>): void {
    for (const childKey in node) {
      this.removeSymbolsRecursively(node[childKey]!);
    }

    if (LEAF in node) {
      node[symbolToString(LEAF)] = node[LEAF]!;
      this.removeSymbolsRecursively(node[LEAF]!);
    }

    if (CHILDREN in node) {
      node[symbolToString(CHILDREN)] = node[CHILDREN]!.map((v) => {
        if (typeof v === "symbol") {
          return symbolToString(v);
        }
        return v;
      }) as any;
    }

    if (VALUE in node) {
      node[symbolToString(VALUE)] = node[VALUE] as any;
    }
    if (RANKING in node) {
      node[symbolToString(RANKING)] = node[RANKING] as any;
    }
    if (CHILD_INDEX in node) {
      node[symbolToString(CHILD_INDEX)] = node[CHILD_INDEX] as any;
    }
  }

  private addSymbolsToNode(node: CompletionTrieNode<T>): CompletionTrieNode<T> {
    const REGEX_SYMBOL_STRING = /^@@(.*)@@$/;
    for (const key of Object.keys(node)) {
      const symbolMatch = REGEX_SYMBOL_STRING.exec(key);
      if (symbolMatch !== null) {
        const symbol: symbol = Symbol.for(symbolMatch[1]);
        if (symbol === LEAF) {
          node[LEAF] = node[key];
        } else if (symbol === VALUE) {
          node[VALUE] = node[key] as any;
        } else if (symbol === RANKING) {
          node[RANKING] = node[key] as any;
        } else if (symbol === CHILD_INDEX) {
          node[CHILD_INDEX] = node[key] as any;
        } else if (symbol === CHILDREN) {
          node[CHILDREN] = (node[key] as any).map((v: any) => {
            const symbolMatch = REGEX_SYMBOL_STRING.exec(v);
            if (symbolMatch !== null) {
              const symbol: symbol = Symbol.for(symbolMatch[1]);
              return symbol;
            } else {
              return v;
            }
          });
        }
        delete node[key];
      }
    }
    return node;
  }

  private addParentLinksRecursively(
    node: CompletionTrieNode<T> | undefined,
    parent?: CompletionTrieNode<T>
  ): void {
    if (node === undefined) {
      return;
    }
    if (parent !== undefined) {
      node[PARENT] = parent;
    }
    for (const childKey in node) {
      this.addParentLinksRecursively(node[childKey], node);
    }
    this.addParentLinksRecursively(node[LEAF], node);
  }

  private removeParentLinksRecursively(
    node: CompletionTrieNode<T> | undefined
  ): void {
    if (node === undefined) {
      return;
    }
    if (node[PARENT] !== undefined) {
      delete node[PARENT];
    }
    for (const childKey in node) {
      this.removeParentLinksRecursively(node[childKey]);
    }
    this.removeParentLinksRecursively(node[LEAF]);
  }
}
