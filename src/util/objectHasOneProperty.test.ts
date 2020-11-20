import objectHasOneProperty from "./objectHasOneProperty";

test("it works", () => {
  expect(objectHasOneProperty({})).toBe(false);
  expect(objectHasOneProperty({ hello: "world" })).toBe(true);
  expect(objectHasOneProperty({ hello: "world", foo: "bar" })).toBe(false);
});
