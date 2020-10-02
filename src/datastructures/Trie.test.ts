import Trie from "./Trie";

test("basic operations work", () => {
  const trie = new Trie();
  trie.set("hello", "world");
  expect(trie.get("hello")).toBe("world");
  expect(trie.size).toBe(1);
  trie.set("hello hello", "world world");
  expect(trie.size).toBe(2);
  expect(trie.get("hello hello")).toBe("world world");
  expect([...trie.findValues("h")]).toEqual(["world", "world world"]);
  expect([...trie.find("h")]).toEqual([
    { key: "hello", value: "world" },
    { key: "hello hello", value: "world world" },
  ]);
});
