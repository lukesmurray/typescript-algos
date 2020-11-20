import longestCommonPrefix from "./longestCommonPrefix";

test("basic prefixes work", () => {
  expect(longestCommonPrefix("test", "testing testing")).toEqual("test");
  expect(longestCommonPrefix("", "")).toEqual("");
  expect(longestCommonPrefix("test", "")).toEqual("");
  expect(longestCommonPrefix("", "test")).toEqual("");
  expect(longestCommonPrefix("😁test", "😁test")).toEqual("😁test");
  expect(longestCommonPrefix("😁", "😁test")).toEqual("😁");
});
