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

test("top k works easy", () => {
  const trie = new CompletionTrie<string>();
  const words = ["s", "so", "soar", "soap", "soft", "softer"];
  words.forEach((word, i) => {
    trie.set(word, word, i);
  });
  expect([...trie.topK("s")]).toEqual(words);
});

test("top k works more challenging", () => {
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
  expect([...trie.topK("s")]).toEqual(words);
});

test("top k works most challenging", () => {
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
  expect([...trie.topK("s")]).toEqual(words);
});

test("top k works with entire words", () => {
  const trie = new CompletionTrie<string>();
  const word = "hypertension";
  trie.set(word, word, 1);
  for (let i = 0; i < word.length; i++) {
    expect([...trie.topK(word.slice(0, i))]).toEqual([word]);
  }
});

test("serialization works", () => {
  const trie = new CompletionTrie<string>();
  const words = ["s", "so", "soar", "soap", "soft", "softer"];
  words.forEach((word, i) => {
    trie.set(word, word, i);
  });
  expect(CompletionTrie.fromJSON<string>(trie.toJSON())).toEqual(trie);
});

test("messaging works", () => {
  const trie = new CompletionTrie<string>();
  const words = ["s", "so", "soar", "soap", "soft", "softer"];
  words.forEach((word, i) => {
    trie.set(word, word, i);
  });
  expect(CompletionTrie.fromMessage<string>(trie.toMessage())).toEqual(trie);
});

test("messaging async works", async () => {
  const trie = new CompletionTrie<string>();
  const words = ["s", "so", "soar", "soap", "soft", "softer"];
  words.forEach((word, i) => {
    trie.set(word, word, i);
  });
  expect(
    await CompletionTrie.fromMessage<string>(trie.toMessage(), {
      useRaf: true,
      maxMillisecondsPerFrame: 3,
    })
  ).toEqual(trie);
});

test("setting with no collisions works", () => {
  const trie = new CompletionTrie<string>();
  const words: Array<[string, string, number]> = [
    ["s", "b", 1],
    ["s", "a", 0],
  ];
  words.forEach(([word, value, score]) => {
    trie.set(word, value, score);
  });
  expect([...trie.topK("s")]).toEqual(["a"]);
});

test("setting with collisions works", () => {
  const trie = new CompletionTrie<string>(true);
  const words: Array<[string, string, number]> = [
    ["s", "b", 1],
    ["s", "c", 2],
    ["s", "a", 0],
  ];
  words.forEach(([word, value, score]) => {
    trie.set(word, value, score);
  });
  expect([...trie.topK("s")]).toEqual(["a", "b", "c"]);
  expect([...trie.getArray("s")]).toEqual(["a", "b", "c"]);
});

test("top k words with collisions trivial", () => {
  const trie = new CompletionTrie<string>(true);
  const words = ["s"];
  const values: Array<[string, string, number]> = [];
  let counter = 0;
  for (const word of words) {
    values.push([word, `${word}_a`, counter++]);
    values.push([word, `${word}_b`, counter++]);
    values.push([word, `${word}_c`, counter++]);
  }

  values.forEach(([word, value, score]) => {
    trie.set(word, value, score);
  });
  expect([...trie.topK("s")]).toEqual(values.map((v) => v[1]));
});

test("top k words with collisions most challenging", () => {
  const trie = new CompletionTrie<string>(true);
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
  const values: Array<[string, string, number]> = [];
  let counter = 0;
  for (const word of words) {
    values.push([word, `${word}_a`, counter++]);
    values.push([word, `${word}_b`, counter++]);
    values.push([word, `${word}_c`, counter++]);
  }

  values.forEach(([word, value, score]) => {
    trie.set(word, value, score);
  });
  expect([...trie.topK("s")]).toEqual(values.map((v) => v[1]));
});
