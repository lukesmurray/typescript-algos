import Stack from "./Stack";

test("basic operations work", () => {
  // create list of values for the stack
  const values = Array.from(Array(100), () => Math.random());
  // push all values on the stack
  const stack = new Stack<number>();
  values.forEach((value) => {
    stack.push(value);
  });
  // popping the stack is equivalent to iterating through values in reverse
  // order
  for (let i = values.length - 1; i >= 0; i--) {
    expect(stack.pop()).toEqual(values[i]);
    expect(stack.length).toEqual(i);
  }
  // stack is now empty
  expect(stack.pop()).toEqual(undefined);
  expect(stack.pop()).toEqual(undefined);
});
