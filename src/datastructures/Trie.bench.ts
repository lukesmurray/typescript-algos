import Benchmark from "benchmark";
import words10k from "../data/10k-words.json";
import words466k from "../data/466k-words.json";
import Trie from "./Trie";

const suite = new Benchmark.Suite();

suite
  .add("trie set/get 10k", function () {
    const trie = new Trie<string>();
    for (const word of words10k) {
      trie.set(word, word);
    }
    for (const word of words10k) {
      if (trie.get(word) !== word) {
        throw new Error("FAIL");
      }
    }
  })
  .add("trie set/get 466k", function () {
    const trie = new Trie<string>();
    // @ts-ignore
    for (const word of words466k) {
      trie.set(word, word);
    }
    // @ts-ignore
    for (const word of words466k) {
      if (trie.get(word) !== word) {
        throw new Error("FAIL");
      }
    }
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .run({ async: true });
