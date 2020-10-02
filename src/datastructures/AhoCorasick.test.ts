import words466k from "../data/466k-words.json";
import AhoCorasick from "./AhoCorasick";

test("basic aho operations work", () => {
  const patterns = ["i", "in", "tin", "sting"];
  const aho = new AhoCorasick<string>();
  for (const pattern of patterns) {
    aho.set(pattern, pattern);
  }
  aho.build();
  expect([...aho.match("sting")].length).toBe(4);
  expect([...aho.match("string")].length).toBe(2);
});

test("basic patterns work", () => {
  const patterns = ["at", "art", "oars", "soar"];
  const aho = new AhoCorasick<string>();
  for (const pattern of patterns) {
    aho.set(pattern, pattern);
  }
  aho.build();
  expect([...aho.match("soar")]).toEqual([{ value: "soar" }]);
  expect([...aho.match("soars")]).toEqual([
    { value: "soar" },
    {
      value: "oars",
    },
  ]);

  expect([...aho.match("oart")]).toEqual([{ value: "art" }]);
  expect([...aho.match("soat")]).toEqual([{ value: "at" }]);
  expect([...aho.match("soarsoars")]).toEqual([
    { value: "soar" },
    { value: "oars" },
    { value: "soar" },
    { value: "oars" },
  ]);
  expect([...aho.match("soarsoar")]).toEqual([
    { value: "soar" },
    { value: "oars" },
    { value: "soar" },
  ]);
  expect([...aho.match("sotat")]).toEqual([{ value: "at" }]);
});

test("degenerate patterns work", () => {
  const patterns = ["a", "aa", "aaa"];
  const aho = new AhoCorasick<string>();
  for (const pattern of patterns) {
    aho.set(pattern, pattern);
  }
  aho.build();
  expect([...aho.match("aaaaaa")]).toEqual([
    // first char
    { value: "a" },
    // second char
    { value: "aa" },
    { value: "a" },
    // third char
    { value: "aaa" },
    { value: "aa" },
    { value: "a" },
    // fourth char
    { value: "aaa" },
    { value: "aa" },
    { value: "a" },
    // fifth char
    { value: "aaa" },
    { value: "aa" },
    { value: "a" },
    // sixth char
    { value: "aaa" },
    { value: "aa" },
    { value: "a" },
  ]);
});

test("massive word set works", () => {
  const aho = new AhoCorasick<string>();
  // @ts-ignore
  for (const word of words466k) {
    aho.set(word, word);
  }
  aho.build();
  console.log(
    JSON.stringify([
      ...aho.match("the quick brown fox jumped over the lazy dog"),
    ])
  );
});
