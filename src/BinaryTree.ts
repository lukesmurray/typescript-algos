import { CompareFn, getCompareFnOrDefault } from "./Util";

class BinaryTree<T> {
  private _root: BinaryTreeNode<T> | undefined;
  private readonly _compareFn: (a: T, b: T) => number;
  private _length: number;

  /**
   *
   * @param compareFn Function used to determine the order of the elements.
   *  It is expected to return a negative value if first argument is less than
   *  second argument, zero if they're equal and a positive value otherwise.
   *  If omitted, the elements are sorted in ascending order using < and >
   *  operators.
   */
  constructor(compareFn?: CompareFn<T>) {
    this._root = undefined;
    this._compareFn = getCompareFnOrDefault<T>(compareFn);
    this._length = 0;
  }

  *inOrderWalk(fromNode?: BinaryTreeNode<T>): Generator<T, void, void> {
    fromNode = fromNode ?? this._root;
    if (fromNode !== undefined) {
      yield* fromNode.inOrderWalk();
    }
  }

  search(value: T): BinaryTreeNode<T> | undefined {
    let curr = this._root;
    while (curr != null) {
      const compareValue = this._compareFn(value, curr.value);
      if (compareValue === 0) {
        return curr;
      } else if (compareValue < 0) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }
    return undefined;
  }

  min(fromNode?: BinaryTreeNode<T>): BinaryTreeNode<T> | undefined {
    // min is the leftmost node so traverse left
    let curr = fromNode ?? this._root;
    while (curr?.left != null) {
      curr = curr.left;
    }
    return curr;
  }

  max(fromNode?: BinaryTreeNode<T>): BinaryTreeNode<T> | undefined {
    // max is the rightmost node so traverse right
    let curr = fromNode ?? this._root;
    while (curr?.right != null) {
      curr = curr.right;
    }
    return curr;
  }

  successor(ofNode: BinaryTreeNode<T>): BinaryTreeNode<T> | undefined {
    let curr = ofNode;
    // if right child exists return min of right tree
    if (curr.right !== undefined) {
      return this.min(curr.right);
    }
    // otherwise take the lowest ancestor whose left child is an ancestor of ofNode.
    let next = curr.parent;
    // go up the tree as long as the parent is defined and the curr element
    // is the right child of the parent
    while (next !== undefined && curr === next?.right) {
      curr = next;
      next = curr.parent;
    }
    // either parent was undefined or we found the lowest left child ancestor
    return next;
  }

  predecessor(ofNode: BinaryTreeNode<T>): BinaryTreeNode<T> | undefined {
    let curr = ofNode;
    // if left child exists return max of left tree
    if (curr.left !== undefined) {
      return this.max(curr.left);
    }
    // otherwise take the lowest ancestor whose right child is an ancestor of ofNode.
    let next = curr.parent;
    // go up the tree as long as the parent is defined and the curr element
    // is the left child of the parent
    while (next !== undefined && curr === next?.left) {
      curr = next;
      next = curr.parent;
    }
    // either parent was undefined or we found the lowest right child ancestor
    return next;
  }

  insert(value: T): number {
    const newNode = new BinaryTreeNode(value);
    let parent: BinaryTreeNode<T> | undefined;

    // iterate down the tree to a leaf
    let curr: BinaryTreeNode<T> | undefined = this._root;
    while (curr !== undefined) {
      // keep a back pointer to the parent
      parent = curr;
      const compareValue = this._compareFn(value, curr.value);
      if (compareValue < 0) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }

    // make prev leaf parent of new node
    newNode.parent = parent;
    // if tree was empty
    if (parent === undefined) {
      this._root = newNode;
    } else {
      // determine which child the new node goes into
      const compareValue = this._compareFn(value, parent.value);
      if (compareValue < 0) {
        parent.left = newNode;
      } else {
        parent.right = newNode;
      }
    }
    this._length++;
    return this._length;
  }

  remove(value: T): T | undefined {
    const nodeToRemove = this.search(value);
    let nodeToSplice: BinaryTreeNode<T> | undefined;
    let childOfNodeToSplice: BinaryTreeNode<T> | undefined;

    if (nodeToRemove === undefined) {
      return undefined;
    }
    // node to remove has one child or no children so splice out the node
    if (nodeToRemove.left === undefined || nodeToRemove.right === undefined) {
      nodeToSplice = nodeToRemove;
    } else {
      // otherwise splice out the successor of the node to remove
      nodeToSplice = this.successor(nodeToRemove);
    }

    // find the child of the node to splice
    if (nodeToSplice?.left !== undefined) {
      childOfNodeToSplice = nodeToSplice.left;
    } else {
      childOfNodeToSplice = nodeToSplice?.right;
    }

    // if there is a child set it's parent so it replaces the previous node
    if (childOfNodeToSplice !== undefined) {
      childOfNodeToSplice.parent = nodeToSplice?.parent;
    }

    // if the spliced node was the root replace the root
    if (nodeToSplice?.parent === undefined) {
      this._root = childOfNodeToSplice;
      // otherwise set the parent child pointer correctly
    } else if (nodeToSplice === nodeToSplice.parent.left) {
      nodeToSplice.parent.left = childOfNodeToSplice;
    } else {
      nodeToSplice.parent.right = childOfNodeToSplice;
    }

    // if the spliced node is the successor, replace the nodeToRemove's data
    // with the spliced node's data.
    if (nodeToSplice !== nodeToRemove && nodeToSplice !== undefined) {
      nodeToRemove.value = nodeToSplice.value;
    }

    this._length--;
    return value;
  }

  get length(): number {
    return this._length;
  }

  get isEmpty(): boolean {
    return this._length === 0;
  }
}

class BinaryTreeNode<T> {
  value: T;
  left: BinaryTreeNode<T> | undefined;
  right: BinaryTreeNode<T> | undefined;
  parent: BinaryTreeNode<T> | undefined;
  constructor(
    value: T,
    left?: BinaryTreeNode<T>,
    right?: BinaryTreeNode<T>,
    parent?: BinaryTreeNode<T>
  ) {
    this.value = value;
    this.left = left;
    this.right = right;
    this.parent = parent;
  }

  *inOrderWalk(): Generator<T, void, void> {
    if (this.left !== undefined) {
      yield* this.left.inOrderWalk();
    }
    yield this.value;
    if (this.right !== undefined) {
      yield* this.right.inOrderWalk();
    }
  }
}

export default BinaryTree;
