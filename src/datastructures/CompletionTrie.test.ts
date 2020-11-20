import CompletionTrie from "./CompletionTrie";

test("basic operations work", () => {
  const trie = new CompletionTrie<string>();
  trie.set("hello", "world", 1);
  expect(trie.get("hello")).toBe("world");
  expect(trie.size).toBe(1);
  trie.set("hello hello", "world world", 1);
  expect(trie.size).toBe(2);
  expect(trie.get("hello hello")).toBe("world world");
  expect([...trie.find("h")]).toEqual([
    { key: "hello", value: "world" },
    { key: "hello hello", value: "world world" },
  ]);
  expect([...trie.findValues("h")]).toEqual(["world", "world world"]);
});

test("find works", () => {
  const trie = new CompletionTrie<string>();
  const compare = (a: string, b: string): number => a.localeCompare(b);
  const words = ["s", "so", "soar", "soap", "soft", "softer"].sort(compare);
  for (const word of words) {
    trie.set(word, word, 1);
  }
  expect([...trie.findValues("")].sort(compare)).toEqual(words);
});

test("find works", () => {
  const trie = new CompletionTrie<string>();
  const words = ["s", "so", "soar", "soap", "soft", "softer"];
  words.forEach((word, i) => {
    trie.set(word, word, i);
  });
  expect([...trie.topK("s")]).toEqual(words.reverse());
});

test("find works", () => {
  const trie = new CompletionTrie<string>();
  const words = [
    "s",
    "so",
    "soar",
    "soap",
    "soft",
    "softer",
    "so so soft",
    "soapy soft",
    // "ss",
    // "sss",
    // "ssss",
    // "sssss",
  ];
  words.forEach((word, i) => {
    trie.set(word, word, i);
  });
  expect([...trie.topK("s")]).toEqual(words.reverse());
});

test("find works", () => {
  const trie = new CompletionTrie<string>();
  const words = [
    "s",
    "so",
    "soar",
    "soap",
    "soft",
    "softer",
    "so so soft",
    "soapy soft",
    "ss",
    "sss",
    "ssss",
    "sssss",
  ];
  words.forEach((word, i) => {
    trie.set(word, word, i);
  });
  expect([...trie.topK("s")]).toEqual(words.reverse());
});
