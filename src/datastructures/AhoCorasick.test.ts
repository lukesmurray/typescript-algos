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
  expect([...aho.match("soar")]).toEqual([{ value: "soar", start: 0, end: 4 }]);
  expect([...aho.match("soars")]).toEqual([
    { value: "soar", start: 0, end: 4 },
    {
      value: "oars",
      start: 1,
      end: 5,
    },
  ]);

  expect([...aho.match("oart")]).toEqual([{ value: "art", start: 1, end: 4 }]);
  expect([...aho.match("soat")]).toEqual([{ value: "at", start: 2, end: 4 }]);
  expect([...aho.match("soarsoars")]).toEqual([
    { value: "soar", start: 0, end: 4 },
    { value: "oars", start: 1, end: 5 },
    { value: "soar", start: 4, end: 8 },
    { value: "oars", start: 5, end: 9 },
  ]);
  expect([...aho.match("soarsoar")]).toEqual([
    { value: "soar", start: 0, end: 4 },
    { value: "oars", start: 1, end: 5 },
    { value: "soar", start: 4, end: 8 },
  ]);
});

test("broken pattern works", () => {
  const patterns = ["at", "art", "oars", "soar"];
  const aho = new AhoCorasick<string>();
  for (const pattern of patterns) {
    aho.set(pattern, pattern);
  }
  aho.build();
  expect([...aho.match("sotat")]).toEqual([{ value: "at", start: 3, end: 5 }]);
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
    { value: "a", start: 0, end: 1 },
    // second char
    { value: "aa", start: 0, end: 2 },
    { value: "a", start: 1, end: 2 },
    // third char
    { value: "aaa", start: 0, end: 3 },
    { value: "aa", start: 1, end: 3 },
    { value: "a", start: 2, end: 3 },
    // fourth char
    { value: "aaa", start: 1, end: 4 },
    { value: "aa", start: 2, end: 4 },
    { value: "a", start: 3, end: 4 },
    // fifth char
    { value: "aaa", start: 2, end: 5 },
    { value: "aa", start: 3, end: 5 },
    { value: "a", start: 4, end: 5 },
    // sixth char
    { value: "aaa", start: 3, end: 6 },
    { value: "aa", start: 4, end: 6 },
    { value: "a", start: 5, end: 6 },
  ]);
});

test("example animals works", () => {
  const aho = new AhoCorasick<string>();
  // @ts-ignore
  for (const word of [
    "the",
    "the quick",
    "the quick brown",
    "quick brown fox",
    "brown fox",
    "fox",
    "lazy dog",
    "dog",
  ]) {
    aho.set(word, word);
  }
  aho.build();
  expect([
    ...aho.match("the quick brown fox jumped over the lazy dog"),
  ]).toEqual([
    { value: "the", start: 0, end: 3 },
    { value: "the quick", start: 0, end: 9 },
    { value: "the quick brown", start: 0, end: 15 },
    { value: "quick brown fox", start: 4, end: 19 },
    { value: "brown fox", start: 10, end: 19 },
    { value: "fox", start: 16, end: 19 },
    { value: "the", start: 32, end: 35 },
    { value: "lazy dog", start: 36, end: 44 },
    { value: "dog", start: 41, end: 44 },
  ]);
});
