# Typescript-algos

Small collection of both common and uncommon data structures written in typescript and published for convenience and use in my projects.
Most of the data structures are based off of implementations from [Introduction to Algorithms](https://en.wikipedia.org/wiki/Introduction_to_Algorithms) and were written for clarity rather than absolute. The Aho Corasick implementation is based off of Stanford's [CS166: Data Structures](http://web.stanford.edu/class/cs166/) slides. The completion trie is a modified implementation of the Completion Trie presented in the paper [Space-efficient data structures for Top-k completion (2013)](https://dl.acm.org/doi/10.1145/2488388.2488440).

Feel free to use these for your own projects but unless you're using one of the starred algorithms I recommend using the implementations from [mnemonist](https://github.com/Yomguithereal/mnemonist).
If you are using one of the starred algorithms I'd love to know what you're building!

I've starred (⭐️) the algorithms which I find interesting.

- [AhoCorasick ⭐️](./src/datastructures/AhoCorasick.ts)
  - Implementation of [Aho-Corasick algorithm](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm) an amazing algorithm for string matching when you have a large static number of patterns to match in a small to medium and dynamic text.
  - Given a set of **N** pattern strings and an input text of length **m** we can find all **z** instances of the pattern strings in the text in time _O(m+z)_. _Note that the number of pattern strings has no impact on the run time!_
- [BinarySearchTree](./src/datastructures/BinarySearchTree.ts)
- [CompletionTrie ⭐️](./src/datastructures/CompletionTrie.ts)
  - Very efficient top-K completions from a trie
  - Given an alphabet of size **E**, a prefix **p**, a number of requested completions **k**, and **L** where **L** is the average length of the completions excluding the common prefix **p**, returns the top k completions in time _O(Ep + kL log(kL))_. If we replace these numbers with some common values, say E=26, k=10, L=9, and p=1 we can find top-k completions in approx. 430 steps. _Note that the number of prefix matches does not factor into the Big O time_. The brute force topk would involve finding all matching entries (p + M\*L) where **p** is the prefix, **L** is the average length of completions excluding the common prefix **p** and **M** is the number of matches plus M log(M) to sort the matches. For even a small number of matches say M=1000, p=1, L=9 this is approximately 16000 steps.
- [CompressedTrie ⭐️](./src/datastructures/CompressedTrie.ts)
  - An implementation of a Trie where edges can contain more than one symbol at a time. Can greatly reduce the size of the trie [under certain circumstances](https://en.wikipedia.org/wiki/Trie#Compressing_tries)
- [Heap](./src/datastructures/Heap.ts)
- [LinkedList](./src/datastructures/LinkedList.ts)
- [Queue](./src/datastructures/Queue.ts)
- [Stack](./src/datastructures/Stack.ts)
- [Trie](./src/datastructures/Trie.ts)

## Installation

```sh
npm install typescript-algos
```

## Usage

```ts
import { LinkedList } from "typescript-algos";

const linkedList = new LinkedList([...Array(10).keys()]);
```

### Releases

Commit your changes.  
Run `npm version patch && npm publish`  
Git Push
