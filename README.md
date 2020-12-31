# Typescript-algos

This is an mit licensed library of data structures written in typescript. Feel free to use it, or submit pull requests if you want to add functionality, tests, or new data structures.

The most interesting data structure in the library is [Aho-Corasick](https://en.wikipedia.org/wiki/Aho-Corasick) which is very efficient at matching words in input text from a static dictionary. (If **n** is the length of text, and **m** is the total number of matches Aho-Corasick finds all matches in **O(n + m)** time). For very large dictionaries this is quite efficient. My implementation of AhoCorasick optionally allows for splitting the creating and building of the Aho-Corasick state machine with [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Tools/Performance/Scenarios/Intensive_JavaScript) so that user experience is not affected. The data structure can be serialized with cycle safe libraries such as [flatted](https://github.com/WebReflection/flatted) but only for small numbers of patterns (approximately 1000 in testing).

## Installation

```sh
npm install typescript-algos
```

## Usage

```ts
import { LinkedList } from "typescript-algos";

const linkedList = new LinkedList([...Array(10).keys()]);
```

## Contributing

### Releases

Commit your changes.  
Run `npm version patch && npm publish`  
Git Push
