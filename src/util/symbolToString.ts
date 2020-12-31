export default function symbolToString(symbol: symbol): string {
  const symbolKey = Symbol.keyFor(symbol);
  if (symbolKey === undefined) {
    throw new Error("serialized symbols must be added to the global registry");
  }
  return `@@${symbolKey}@@`;
}
