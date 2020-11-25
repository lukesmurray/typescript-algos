import BinarySearchTree from "./BinarySearchTree";

test("binary tree works", () => {
  const values = Array.from(Array(100), () => Math.random());
  const tree = new BinarySearchTree<number>();
  values.forEach((value) => tree.add(value));
  // find all the elements in the tree
  values.forEach((value) => expect(tree.contains(value)?.value).toBe(value));
  // test min max
  expect(tree.min()?.value).toEqual(Math.min(...values));
  expect(tree.max()?.value).toEqual(Math.max(...values));
  // test search outside of tree
  expect(tree.contains(2)).toBeUndefined();
  // test ordered walk
  const sortedValues = [...values].sort((a, b) => a - b);
  const orderedWalkGenerator = tree.inOrderTraversal();
  for (let i = 0; i < sortedValues.length; i++) {
    expect(orderedWalkGenerator.next().value).toEqual(sortedValues[i]);
  }
  // test predecessor and successors
  for (let i = 0; i < sortedValues.length; i++) {
    if (i !== 0) {
      const currVal = sortedValues[i];
      const predVal = sortedValues[i - 1];
      const currNode = tree.contains(currVal);
      expect(currNode).toBeDefined();
      if (currNode !== undefined) {
        expect(tree.predecessor(currNode)?.value).toEqual(predVal);
      }
    }
    if (i !== sortedValues.length - 2) {
      const currVal = sortedValues[i];
      const succVal = sortedValues[i + 1];
      const currNode = tree.contains(currVal);
      expect(currNode).toBeDefined();
      if (currNode !== undefined) {
        expect(tree.successor(currNode)?.value).toEqual(succVal);
      }
    }
  }
});

test("binary tree insert and remove", () => {
  for (const values of [
    Array.from(Array(100), (_, i) => i).reverse(),
    Array.from(Array(100), (_, i) => i),
  ]) {
    const tree = new BinarySearchTree<number>();
    // insert all values and make sure they all work
    values.forEach((v, i) => {
      expect(tree.add(v)).toEqual(i + 1);
      expect(tree.length).toEqual(i + 1);
    });
    values.forEach((v) => {
      expect(tree.contains(v)?.value).toEqual(v);
    });
    const evenValues = values.filter((v) => v % 2 === 0);
    const oddValues = values.filter((v) => v % 2 !== 0);
    evenValues.reverse().forEach((v) => expect(tree.remove(v)).toEqual(v));
    evenValues.forEach((v) => {
      expect(tree.contains(v)?.value).toBeUndefined();
    });
    oddValues.forEach((v) => {
      expect(tree.contains(v)?.value).toEqual(v);
    });
    evenValues.forEach((v) => tree.add(v));
    evenValues.forEach((v) => {
      expect(tree.contains(v)?.value).toEqual(v);
    });
    values.forEach((v) => {
      tree.remove(v);
    });
  }
});
