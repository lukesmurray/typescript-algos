import { CompareFn, defaultCompareFn } from "./Util";
import Queue from "./Queue";

class BinarySearchTree<T> {
  private _root: BinarySearchTreeNode<T> | undefined;
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
    this._compareFn = compareFn ?? defaultCompareFn;
    this._length = 0;
  }

  *inOrderTraversal(
    fromNode?: BinarySearchTreeNode<T>
  ): Generator<T, void, void> {
    fromNode = fromNode ?? this._root;
    if (fromNode !== undefined) {
      yield* fromNode.inOrderTraversal();
    }
  }

  *preOrderTraversal(
    fromNode?: BinarySearchTreeNode<T>
  ): Generator<T, void, void> {
    fromNode = fromNode ?? this._root;
    if (fromNode !== undefined) {
      yield* fromNode.preOrderTraversal();
    }
  }

  *postOrderTraversal(
    fromNode?: BinarySearchTreeNode<T>
  ): Generator<T, void, void> {
    fromNode = fromNode ?? this._root;
    if (fromNode !== undefined) {
      yield* fromNode.postOrderTraversal();
    }
  }

  *levelTraversal(
    fromNode?: BinarySearchTreeNode<T>
  ): Generator<T, void, void> {
    fromNode = fromNode ?? this._root;
    if (fromNode !== undefined) {
      yield* fromNode.levelTraversal();
    }
  }

  contains(value: T): BinarySearchTreeNode<T> | undefined {
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

  min(fromNode?: BinarySearchTreeNode<T>): BinarySearchTreeNode<T> | undefined {
    // min is the leftmost node so traverse left
    let curr = fromNode ?? this._root;
    while (curr?.left != null) {
      curr = curr.left;
    }
    return curr;
  }

  max(fromNode?: BinarySearchTreeNode<T>): BinarySearchTreeNode<T> | undefined {
    // max is the rightmost node so traverse right
    let curr = fromNode ?? this._root;
    while (curr?.right != null) {
      curr = curr.right;
    }
    return curr;
  }

  successor(
    ofNode: BinarySearchTreeNode<T>
  ): BinarySearchTreeNode<T> | undefined {
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

  predecessor(
    ofNode: BinarySearchTreeNode<T>
  ): BinarySearchTreeNode<T> | undefined {
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

  add(value: T): number {
    const newNode = new BinarySearchTreeNode(value);
    let parent: BinarySearchTreeNode<T> | undefined;

    // iterate down the tree to a leaf
    let curr: BinarySearchTreeNode<T> | undefined = this._root;
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
    const nodeToRemove = this.contains(value);
    let nodeToSplice: BinarySearchTreeNode<T> | undefined;
    let childOfNodeToSplice: BinarySearchTreeNode<T> | undefined;

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
}

class BinarySearchTreeNode<T> {
  value: T;
  left: BinarySearchTreeNode<T> | undefined;
  right: BinarySearchTreeNode<T> | undefined;
  parent: BinarySearchTreeNode<T> | undefined;
  constructor(
    value: T,
    left?: BinarySearchTreeNode<T>,
    right?: BinarySearchTreeNode<T>,
    parent?: BinarySearchTreeNode<T>
  ) {
    this.value = value;
    this.left = left;
    this.right = right;
    this.parent = parent;
  }

  *inOrderTraversal(): Generator<T, void, void> {
    if (this.left !== undefined) {
      yield* this.left.inOrderTraversal();
    }
    yield this.value;
    if (this.right !== undefined) {
      yield* this.right.inOrderTraversal();
    }
  }

  *preOrderTraversal(): Generator<T, void, void> {
    yield this.value;
    if (this.left !== undefined) {
      yield* this.left.inOrderTraversal();
    }
    if (this.right !== undefined) {
      yield* this.right.inOrderTraversal();
    }
  }

  *postOrderTraversal(): Generator<T, void, void> {
    if (this.left !== undefined) {
      yield* this.left.inOrderTraversal();
    }
    if (this.right !== undefined) {
      yield* this.right.inOrderTraversal();
    }
    yield this.value;
  }

  *levelTraversal(): Generator<T, void, void> {
    const q = new Queue<BinarySearchTreeNode<T>>();
    q.enqueue(this);
    while (q.length !== 0) {
      const next = q.dequeue();
      if (next !== undefined) {
        if (next.left !== undefined) {
          q.enqueue(next.left);
        }
        if (next.right !== undefined) {
          q.enqueue(next.right);
        }
        yield next.value;
      }
    }
  }
}

export default BinarySearchTree;
