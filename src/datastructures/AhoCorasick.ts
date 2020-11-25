/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Full from "../util/Full";
import Queue from "./Queue";

// for leftmost semantics see
// https://github.com/BurntSushi/aho-corasick/blob/master/DESIGN.md
// https://github.com/BurntSushi/aho-corasick/blob/master/src/nfa.rs
// only add failure transitions which do not occur after a match or do occur after a match but preserve the match
// in the queue store the depth at which the first match was observed in the path to the current state
// this is the depth where the beginning of the match was detected, if no match has been seen it is None
// if the

/* eslint-disable @typescript-eslint/no-dynamic-delete */
const SENTINEL = "VALUE";
const PARENT = "PARENT";
const SUFFIXLINK = "SUFFIX";
const OUTPUTLINK = "OUTPUT";
const DEPTH = "DEPTH";

interface BaseAhoBuildOptions {
  /**
   * The maximum number of milliseconds to use per frame.
   */
  maxMillisecondsPerFrame?: number;
}

interface AhoBuildOptionsWithRaf extends BaseAhoBuildOptions {
  /**
   * wether or not to use request animation frame while building.
   * If true the build process will use request animation frame to
   * avoid throttling the ui thread.
   */
  useRaf: true;
}
interface AhoBuildOptionsWithoutRaf extends BaseAhoBuildOptions {
  /**
   * wether or not to use request animation frame while building.
   * If true the build process will use request animation frame to
   * avoid throttling the ui thread.
   */
  useRaf?: false;
}

export type AhoBuildOptions =
  | AhoBuildOptionsWithRaf
  | AhoBuildOptionsWithoutRaf;

export interface AhoSerialize<T> {
  root: AhoNode<T>;
  upToDate: boolean;
  size: number;
}

interface AhoNode<T> {
  [key: string]: AhoNode<T> | undefined;
}

export interface AhoMatch<T> {
  /**
   * the value of the match
   */
  value: T;
  /**
   * the start of the match inclusive
   */
  start: number;
  /**
   * the end of the match exclusive.
   */
  end: number;
  /**
   * the length of the match. equal to end - start.
   */
  length: number;
}

export type AhoPatternDict<T> = Record<string, T>;

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
  private root: AhoNode<T>;

  constructor() {
    this._upToDate = false;
    this._size = 0;
    this.root = {
      [DEPTH]: 0 as any,
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
    return node[SENTINEL] as any;
  }

  /**
   * Check to see if a key is contained in aho corasick
   * @param key the key to check in the trie
   */
  public has(key: string): boolean {
    let node: AhoNode<T> | undefined = this.root;
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
          [DEPTH]: (((parent[DEPTH] as unknown) as number) + 1) as any,
        });
    }

    if (!(SENTINEL in node)) {
      this._size++;
    }

    // set the sentinel to be the value
    node[SENTINEL] = value as any;
    this._upToDate = false;
  }

  public setPatternDict(
    patternDict: AhoPatternDict<T>,
    buildOptions?: AhoBuildOptionsWithoutRaf
  ): void;

  public setPatternDict(
    patternDict: AhoPatternDict<T>,
    buildOptions: AhoBuildOptionsWithRaf
  ): Promise<void>;

  /**
   * Set all the values from a pattern dictionary
   */
  public setPatternDict(
    patternDict: AhoPatternDict<T>,
    buildOptions?: AhoBuildOptions
  ): Promise<void> | void {
    const normalizedBuildOptions = normalizeBuildOptions(buildOptions);
    const patternStack = Object.keys(patternDict);
    const processPattern = (): void => {
      const pattern = patternStack.pop()!;
      this.set(pattern, patternDict[pattern]);
    };
    if (!normalizedBuildOptions.useRaf) {
      while (patternStack.length !== 0) {
        processPattern();
      }
    } else {
      // if using raf return a promise
      return new Promise((resolve, reject) => {
        // process children using raf
        const processPatternQueue = (taskStartTime: number): void => {
          // process children for maxMillisecondsPerFrame
          try {
            let taskFinishTime;
            do {
              if (patternStack.length !== 0) {
                processPattern();
              }
              taskFinishTime = performance.now();
            } while (
              patternStack.length !== 0 &&
              taskFinishTime - taskStartTime <
                normalizedBuildOptions.maxMillisecondsPerFrame
            );

            // if done then return otherwise request another frame
            if (patternStack.length !== 0) {
              requestAnimationFrame(processPatternQueue);
            } else {
              resolve();
            }
          } catch (err) {
            reject(err);
          }
        };
        requestAnimationFrame(processPatternQueue);
      });
    }
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

  /**
   * Find all values in the aho which start with the prefix
   * @param prefix the prefix to search for in the trie.
   */
  public *find(prefix: string): Generator<{ key: string; value: T }> {
    let node: AhoNode<T> | undefined = this.root;
    let token: string;

    for (let i = 0, l = prefix.length; i < l; i++) {
      token = prefix[i];
      node = node[token];

      if (node === undefined) {
        return;
      }
    }

    // Performing DFS from prefix
    const nodeStack: Array<AhoNode<T>> = [node];
    const keyStack: string[] = [prefix];

    // while there are nodes to look at
    while (nodeStack.length !== 0) {
      prefix = keyStack.pop()!;
      node = nodeStack.pop()!;

      // yield value if it exists
      if (node[SENTINEL] !== undefined) {
        yield { key: prefix, value: node[SENTINEL] as any };
      }

      // iterate over children
      for (const [key] of this.nodeGetChildrenEntries(node)) {
        // add the child to our stack
        nodeStack.push(node[key]!);
        keyStack.push(prefix + key);
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

  public build(buildOptions?: AhoBuildOptionsWithoutRaf): void;
  public build(buildOptions: AhoBuildOptionsWithRaf): Promise<void>;
  public build(buildOptions?: AhoBuildOptions): Promise<void> | void {
    const normalizedBuildOptions = normalizeBuildOptions(buildOptions);

    if (this._upToDate) {
      if (normalizedBuildOptions.useRaf) {
        return Promise.resolve();
      }
      return;
    }

    // breadth first search
    const childQueue = new Queue<{ token?: string; node: AhoNode<T> }>();
    childQueue.enqueue({ node: this.root });

    // the process function for breadth first search
    const processChild = (): void => {
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

      // if the node is not the root
      if (node !== this.root) {
        // reset the output link
        node[OUTPUTLINK] = undefined;

        // follow the suffix link of node
        const u = node[SUFFIXLINK]!;

        // if we get a match set the output link to the suffix link node
        if (u[SENTINEL] !== undefined) {
          node[OUTPUTLINK] = u;
        }
        // if we don't get a match set the output link to the output link
        // of the node
        else {
          node[OUTPUTLINK] = u[OUTPUTLINK];
        }
      }

      // add all the children to the queue
      for (const [token, child] of this.nodeGetChildrenEntries(node)) {
        childQueue.enqueue({ token, node: child });
      }
    };

    // if not using raf then process children until queue is empty
    if (!normalizedBuildOptions.useRaf) {
      while (!childQueue.isEmpty()) {
        processChild();
      }
      this._upToDate = true;
    } else {
      // if using raf return a promise
      return new Promise((resolve, reject) => {
        // process children using raf
        const processChildQueue = (taskStartTime: number): void => {
          // process children for maxMillisecondsPerFrame
          try {
            let taskFinishTime;
            do {
              if (!childQueue.isEmpty()) {
                processChild();
              }
              taskFinishTime = performance.now();
            } while (
              !childQueue.isEmpty() &&
              taskFinishTime - taskStartTime <
                normalizedBuildOptions.maxMillisecondsPerFrame
            );

            // if done then return otherwise request another frame
            if (!childQueue.isEmpty()) {
              requestAnimationFrame(processChildQueue);
            } else {
              this._upToDate = true;
              resolve();
            }
          } catch (err) {
            reject(err);
          }
        };
        requestAnimationFrame(processChildQueue);
      });
    }
  }

  public match(string: string): Array<AhoMatch<T>> {
    let token: string;
    let node: AhoNode<T> = this.root;
    let output: AhoNode<T> | undefined;
    let start = 0;
    let depth = 0;
    let newDepth = 0;
    let outputDepth = 0;
    let outputStart = 0;

    const matches: Array<AhoMatch<T>> = [];

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
        const match: AhoMatch<T> = {
          value: node[SENTINEL]! as any,
          start,
          end: i + 1,
          length: i + 1 - start,
        };
        matches.push(match);
      }

      // output all words in the output links originating from the node
      output = node[OUTPUTLINK];
      outputDepth = ((output?.[DEPTH] as unknown) ?? 0) as number;
      outputStart = start + (depth - outputDepth);
      while (output !== undefined) {
        const match: AhoMatch<T> = {
          value: output[SENTINEL]! as any,
          start: outputStart,
          end: i + 1,
          length: i + 1 - outputStart,
        };
        matches.push(match);
        output = output[OUTPUTLINK];
        newDepth = ((output?.[DEPTH] as unknown) ?? 0) as number;
        outputStart = outputStart + (outputDepth - newDepth);
        outputDepth = newDepth;
      }
    }

    return matches;
  }

  public matchLeftmostLongest(string: string): Array<AhoMatch<T>> {
    const matches: Array<AhoMatch<T>> = [];
    const allMatches = [...this.match(string)];
    // sort by start ascending then by length descending
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    allMatches.sort((a, b) => a.start - b.start || b.length - a.length);
    let nextPossible = 0;
    for (const match of allMatches) {
      if (match.start >= nextPossible) {
        matches.push(match);
        nextPossible = match.end;
      }
    }
    return matches;
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

  public serialize(): AhoSerialize<T> {
    return {
      root: this.root,
      size: this.size,
      upToDate: this.upToDate,
    };
  }

  public static deserialize<U>(serialized: AhoSerialize<U>): AhoCorasick<U> {
    const aho = new AhoCorasick<U>();
    aho._size = serialized.size;
    aho._upToDate = serialized.upToDate;
    aho.root = serialized.root;
    return aho;
  }
}

function normalizeBuildOptions(
  buildOptions?: AhoBuildOptions
): Full<AhoBuildOptions> {
  return {
    maxMillisecondsPerFrame: 3,
    useRaf: false,
    ...buildOptions,
  };
}
