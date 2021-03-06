const objectIsEmpty = <T extends Object>(obj: T): boolean => {
  for (const _ in obj) {
    return false;
  }
  return true;
};

export default objectIsEmpty;
