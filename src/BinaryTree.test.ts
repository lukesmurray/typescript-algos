import BinaryTree from "./BinaryTree";

test("binary tree works", () => {
  const values = Array.from(Array(100), () => Math.random());
  const tree = new BinaryTree<number>();
  values.forEach((value) => tree.insert(value));
  // find all the elements in the tree
  values.forEach((value) => expect(tree.search(value)?.value).toBe(value));
  // test min max
  expect(tree.min()?.value).toEqual(Math.min(...values));
  expect(tree.max()?.value).toEqual(Math.max(...values));
  // test search outside of tree
  expect(tree.search(2)).toBeUndefined();
  // test ordered walk
  const sortedValues = [...values].sort((a, b) => a - b);
  const orderedWalkGenerator = tree.inOrderWalk();
  for (let i = 0; i < sortedValues.length; i++) {
    expect(orderedWalkGenerator.next().value).toEqual(sortedValues[i]);
  }
  // test predecessor and successors
  for (let i = 0; i < sortedValues.length; i++) {
    if (i !== 0) {
      const currVal = sortedValues[i];
      const predVal = sortedValues[i - 1];
      const currNode = tree.search(currVal);
      expect(currNode).toBeDefined();
      if (currNode !== undefined) {
        expect(tree.predecessor(currNode)?.value).toEqual(predVal);
      }
    }
    if (i !== sortedValues.length - 2) {
      const currVal = sortedValues[i];
      const succVal = sortedValues[i + 1];
      const currNode = tree.search(currVal);
      expect(currNode).toBeDefined();
      if (currNode !== undefined) {
        expect(tree.successor(currNode)?.value).toEqual(succVal);
      }
    }
  }
});
