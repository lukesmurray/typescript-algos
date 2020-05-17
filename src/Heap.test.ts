import Heap from "./Heap";

test("should find max correctly", () => {
  const values = Array.from(Array(100), (v, i) => i);
  const heap = new Heap<number>();
  values.forEach((v, i) => {
    expect(heap.insert(v)).toEqual(i + 1);
    expect(heap.max()).toEqual(i);
  });
  values.reverse().forEach((v) => {
    expect(heap.extractMax()).toEqual(v);
  });
  expect(heap.extractMax()).toBeUndefined();
  expect(heap.max()).toBeUndefined();
});
