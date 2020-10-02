/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Queue from "./Queue";

// for leftmost semantics see
// https://github.com/BurntSushi/aho-corasick/blob/master/DESIGN.md
// https://github.com/BurntSushi/aho-corasick/blob/master/src/nfa.rs

/* eslint-disable @typescript-eslint/no-dynamic-delete */
const SENTINEL = "VALUE";
const PARENT = "PARENT";
const SUFFIXLINK = "SUFFIX";
const OUTPUTLINK = "OUTPUT";
const DEPTH = "DEPTH";

interface AhoNode<T> {
  [key: string]: AhoNode<T> | undefined;
}

export interface AhoMatch<T> {
  value: T;
  start: number;
  end: number;
}

export default class AhoCorasick<T> {
  /**
   * whether or not the automata is up to date.
   */
  private _upToDate: boolean;
  /**
   * the number of patterns in the automata
   */
  private _size: number;

  /**
   * the root of the automata
   */
  private readonly root: AhoNode<T>;

  constructor() {
    this._upToDate = false;
    this._size = 0;
    this.root = {
      // @ts-ignore
      [DEPTH]: 0,
    };
  }

  /**
   * Whether the automata is up to date.
   * If the automata is not up to date it needs to be rebuilt.
   */
  public get upToDate(): boolean {
    return this._upToDate;
  }

  /**
   * The number of patterns in the aho automata
   */
  public get size(): number {
    return this._size;
  }

  /**
   * Get the value from aho corasick associated with the given value
   * @param pattern the pattern to get a value for
   */
  public get(pattern: string): T | undefined {
    let node: AhoNode<T> | undefined = this.root;
    let token: string;

    // iterate over tokens
    for (let i = 0, l = pattern.length; i < l; i++) {
      token = pattern[i];
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
    // @ts-ignore
    return node[SENTINEL];
  }

  /**
   * Add a new pattern to aho corasick with the given value.
   * @param pattern the pattern to add
   * @param value the value to add
   */
  public set(pattern: string, value: T): void {
    let node: AhoNode<T> | undefined = this.root;
    let token: string;
    let parent: AhoNode<T> | undefined;

    // for each token in the word create a new node or set the token
    for (let i = 0, l = pattern.length; i < l; i++) {
      token = pattern[i];
      parent = node;
      node =
        node[token] ??
        (node[token] = {
          [PARENT]: parent,
          // @ts-ignore
          [DEPTH]: ((parent[DEPTH] as number) + 1) as any,
        });
    }

    if (!(SENTINEL in node)) {
      this._size++;
    }

    // set the sentinel to be the value
    // @ts-ignore
    node[SENTINEL] = value;
    this._upToDate = false;
  }

  /**
   * Delete a pattern from aho corasick
   * @param pattern the pattern to delete
   */
  public delete(pattern: string): boolean {
    let node: AhoNode<T> | undefined = this.root;
    let token: string;
    let parent: AhoNode<T>;
    let toPrune: AhoNode<T> | null = null;
    let tokenToPrune: string | null = null;

    // iterate over the node's children
    for (let i = 0, l = pattern.length; i < l; i++) {
      token = pattern[i];
      parent = node;
      node = node[token];

      // Prefix does not exist
      if (node === undefined) {
        return false;
      }

      // Keeping track of a potential branch to prune
      if (toPrune !== null) {
        // if the node has more than one child we can't remove it
        if (this.nodeNumChildren(node) > 1) {
          toPrune = null;
          tokenToPrune = null;
        }
      } else {
        // if the node is a leaf or has only 1 child
        // we want to remove it. we only hit this
        // if toPrune === null so the topmost node in a chain
        // of nodes with one child would be removed
        if (this.nodeNumChildren(node) < 2) {
          toPrune = parent;
          tokenToPrune = token;
        }
      }
    }

    if (!(SENTINEL in node)) {
      return false;
    }

    this._size--;
    this._upToDate = false;

    if (toPrune !== null && tokenToPrune !== null) {
      delete toPrune[tokenToPrune];
    } else {
      delete node[SENTINEL];
    }

    return true;
  }

  public build(): void {
    if (this._upToDate) {
      return;
    }

    // breadth first search
    const childQueue = new Queue<{ token?: string; node: AhoNode<T> }>();
    childQueue.enqueue({ node: this.root });
    while (!childQueue.isEmpty()) {
      // add suffix links

      // add suffix links to the first child in the queue
      const { node, token } = childQueue.dequeue()!;

      // root note has no suffix links
      if (node !== this.root) {
        // children of the root have the root as suffix links
        if (node[PARENT] === this.root) {
          node[SUFFIXLINK] = this.root;
        } else {
          // reset the suffix link
          node[SUFFIXLINK] = undefined;

          // node is string wa
          const w = node[PARENT]!;
          const a = token!;

          // x is node pointed to by w's suffix link
          let x = w[SUFFIXLINK]!;
          while (node[SUFFIXLINK] === undefined) {
            // if xa exists then that is the suffixlink
            if (x[a] !== undefined) {
              node[SUFFIXLINK] = x[a];
              // if x is the root then the root is the suffixlink
            } else if (x === this.root) {
              node[SUFFIXLINK] = this.root;
              // otherwise repeat with x set to x's suffix link
            } else {
              x = x[SUFFIXLINK]!;
            }
          }
        }
      }

      // add output links

      if (node !== this.root) {
        node[OUTPUTLINK] = undefined;
        const u = node[SUFFIXLINK]!;
        if (u[SENTINEL] !== undefined) {
          node[OUTPUTLINK] = u;
        } else {
          node[OUTPUTLINK] = u[OUTPUTLINK];
        }
      }

      // add all the children to the queue
      for (const [token, child] of this.nodeGetChildrenEntries(node)) {
        childQueue.enqueue({ token, node: child });
      }
    }
    this._upToDate = true;
  }

  public *match(string: string): Generator<AhoMatch<T>> {
    let token: string;
    let node: AhoNode<T> = this.root;
    let output: AhoNode<T> | undefined;
    let start = 0;
    let depth = 0;
    let newDepth = 0;
    let outputDepth = 0;
    let outputStart = 0;

    if (!this._upToDate) {
      throw new Error("aho has not been built");
    }

    // iterate through the string
    for (let i = 0, l = string.length; i < l; i++) {
      token = string[i];

      // while no edge labeled with the token
      while (node[token] === undefined) {
        // if we reach the root break out of the loop
        if (node === this.root) {
          break;
        } else {
          // follow a suffix link
          node = node[SUFFIXLINK]!;

          // increment the start pointer by the depth change of the suffix link
          newDepth = (node[DEPTH] as unknown) as number;
          start = start + (depth - newDepth);
          depth = newDepth;
        }
      }

      // if no token there is no match at this start and end so increment the start
      if (node[token] === undefined) {
        start++;
        continue;
      }

      // follow the edge with the token
      node = node[token]!;
      depth++;

      // if the current node is a pattern output the pattern
      if (node[SENTINEL] !== undefined) {
        yield {
          // @ts-ignore
          value: node[SENTINEL]!,
          start,
          end: i + 1,
        };
      }

      // output all words in the output links originating from the node
      output = node[OUTPUTLINK];
      outputDepth = ((output?.[DEPTH] as unknown) ?? 0) as number;
      outputStart = start + (depth - outputDepth);
      while (output !== undefined) {
        // @ts-ignore
        yield { value: output[SENTINEL]!, start: outputStart, end: i + 1 };
        output = output[OUTPUTLINK];
        newDepth = ((output?.[DEPTH] as unknown) ?? 0) as number;
        outputStart = outputStart + (outputDepth - newDepth);
        outputDepth = newDepth;
      }
    }
  }

  /**
   * Return the child entries of a node as [string, child] array.
   * The string is the key used by node to get to child.
   * @param node the node to get children of
   */
  private *nodeGetChildrenEntries(
    node: AhoNode<T>
  ): Generator<[string, AhoNode<T>]> {
    for (const key in node) {
      if (key.length === 1) {
        yield [key, node[key]!];
      }
    }
  }

  private nodeNumChildren(node: AhoNode<T>): number {
    let childrenCount = 0;
    for (const key in node) {
      if (key.length === 1) {
        childrenCount++;
      }
    }
    return childrenCount;
  }
}
