const objectHasOneProperty = <T extends Object>(obj: T): boolean =>
  Object.getOwnPropertyNames(obj).length === 1;

export default objectHasOneProperty;
