import Benchmark from "benchmark";
import words10k from "../data/10k-words.json";
import words466k from "../data/466k-words.json";
import AhoCorasick from "./AhoCorasick";

const suite = new Benchmark.Suite();

suite
  .add("aho build 10k", function () {
    const aho = new AhoCorasick<string>();
    for (const word of words10k) {
      aho.set(word, word);
    }
    aho.build();
  })
  .add("aho build 466k", function () {
    const aho = new AhoCorasick<string>();
    // @ts-ignore
    for (const word of words466k) {
      aho.set(word, word);
    }
    aho.build();
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .run({ async: true });
