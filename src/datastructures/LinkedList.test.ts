import LinkedList from "./LinkedList";

test("basic stack operations work", () => {
  const values = Array.from(Array(100), () => Math.random());
  const linkedList = new LinkedList<number>();
  values.forEach((value) => {
    linkedList.push(value);
  });
  for (let i = values.length - 1; i >= 0; i--) {
    expect(linkedList.isEmpty()).toEqual(false);
    expect(linkedList.pop()).toEqual(values[i]);
    expect(linkedList.length).toEqual(i);
  }
  expect(linkedList.isEmpty()).toEqual(true);
  expect(linkedList.pop()).toEqual(undefined);
  expect(linkedList.pop()).toEqual(undefined);
});

test("basic start operations work", () => {
  const values = Array.from(Array(100), () => Math.random());
  const linkedList = new LinkedList<number>();
  values.forEach((value) => {
    linkedList.unshift(value);
  });
  for (let i = values.length - 1; i >= 0; i--) {
    expect(linkedList.isEmpty()).toEqual(false);
    expect(linkedList.shift()).toEqual(values[i]);
    expect(linkedList.length).toEqual(i);
  }
  expect(linkedList.isEmpty()).toEqual(true);
  expect(linkedList.shift()).toEqual(undefined);
  expect(linkedList.shift()).toEqual(undefined);
});

test("iteration works", () => {
  const values = Array.from(Array(100), () => Math.random());
  const linkedList = new LinkedList<number>();
  values.forEach((value) => {
    linkedList.push(value);
  });

  let i = 0;
  for (const item of linkedList) {
    expect(item.value).toEqual(values[i]);
    i++;
  }
});
