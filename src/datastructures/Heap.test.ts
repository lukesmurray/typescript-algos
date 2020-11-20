import Heap from "./Heap";

test("should find min correctly", () => {
  const values = Array.from(Array(100), (v, i) => i).reverse();
  const heap = new Heap<number>();
  values.forEach((v, i) => {
    expect(heap.add(v)).toEqual(i + 1);
    expect(heap.peek()).toEqual(v);
  });
  values.reverse().forEach((v) => {
    expect(heap.removeRoot()).toEqual(v);
  });
  expect(heap.removeRoot()).toBeUndefined();
  expect(heap.peek()).toBeUndefined();
});

test("works when close to empty", () => {
  const heap = new Heap<number>();
  heap.add(1);
  expect(heap.removeRoot()).toEqual(1);
  expect(heap.removeRoot()).toBeUndefined();
  heap.add(1);
  heap.add(2);
  expect(heap.removeRoot()).toEqual(1);
  expect(heap.removeRoot()).toEqual(2);
  expect(heap.removeRoot()).toBeUndefined();
  heap.add(1);
  heap.add(2);
  heap.add(3);
  expect(heap.removeRoot()).toEqual(1);
  expect(heap.removeRoot()).toEqual(2);
  expect(heap.removeRoot()).toEqual(3);
  expect(heap.removeRoot()).toBeUndefined();
});

test("works with duplicates", () => {
  const heap = new Heap<number>();
  heap.add(1);
  heap.add(1);
  heap.add(1);
  expect(heap.removeRoot()).toEqual(1);
  expect(heap.removeRoot()).toEqual(1);
  expect(heap.removeRoot()).toEqual(1);
  expect(heap.removeRoot()).toBeUndefined();
});
