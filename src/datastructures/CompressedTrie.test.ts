import CompressedTrie from "./CompressedTrie";

test("basic operations work", () => {
  const trie = new CompressedTrie<string>();
  trie.set("hello", "world");
  expect(trie.get("hello")).toBe("world");
  expect(trie.size).toBe(1);
  trie.set("hello hello", "world world");
  expect(trie.size).toBe(2);
  expect(trie.get("hello hello")).toBe("world world");
  expect([...trie.find("h")]).toEqual([
    { key: "hello", value: "world" },
    { key: "hello hello", value: "world world" },
  ]);
  expect([...trie.findValues("h")]).toEqual(["world", "world world"]);
});

test("find works", () => {
  const trie = new CompressedTrie<string>();
  const compare = (a: string, b: string): number => a.localeCompare(b);
  const words = ["s", "so", "soar", "soap", "soft"].sort(compare);
  for (const word of words) {
    trie.set(word, word);
  }
  expect([...trie.findValues("")].sort(compare)).toEqual(words);
});
