const objectHasOneProperty = <T extends Object>(obj: T): boolean => {
  let found = false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _ in obj) {
    if (found) {
      return false;
    }
    found = true;
  }
  return found;
};

export default objectHasOneProperty;
