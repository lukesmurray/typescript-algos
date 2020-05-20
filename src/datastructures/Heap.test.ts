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
