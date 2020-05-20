import Queue from "./Queue";

test("basic queue operations work", () => {
  const values = Array.from(Array(100), () => Math.random());
  const queue = new Queue<number>();
  values.forEach((value) => {
    queue.enqueue(value);
  });
  for (let i = 0; i < values.length; i++) {
    expect(queue.dequeue()).toEqual(values[i]);
    expect(queue.length).toEqual(values.length - i - 1);
  }
});
