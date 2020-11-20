const longestCommonPrefix = (a: string, b: string): string => {
  let i = 0;
  const l = Math.min(a.length, b.length);
  for (; i < l; i++) {
    if (a[i] !== b[i]) {
      break;
    }
  }
  return a.slice(0, i);
};

export default longestCommonPrefix;
