import objectIsEmpty from "./objectIsEmpty";

test("it works", () => {
  expect(objectIsEmpty({})).toBe(true);
  expect(objectIsEmpty({ hello: "world" })).toBe(false);
});

test("deleting keys", () => {
  const obj: any = { hello: "world" };
  expect(objectIsEmpty(obj)).toBe(false);
  delete obj.hello;
  expect(objectIsEmpty(obj)).toBe(true);
});

test("undefined keys", () => {
  const obj: any = { hello: undefined };
  expect(objectIsEmpty(obj)).toBe(false);
});
