/**
 * Parse a string of json containing symbols serialized using symbolToString
 */
export default function jsonParseSerializedSymbols<T = any>(
  serializedString: string
): T {
  const REGEX_SYMBOL_STRING = /^@@(.*)@@$/;

  return JSON.parse(serializedString, function (key, value) {
    // get the return value
    let returnValue = value;
    if (typeof value === "string") {
      const valueMatch = REGEX_SYMBOL_STRING.exec(value);
      if (valueMatch !== null) {
        returnValue = Symbol.for(valueMatch[1]);
      }
    }

    // if the key is a symbol replace the key
    const keyMatch = REGEX_SYMBOL_STRING.exec(key);
    if (keyMatch !== null) {
      this[Symbol.for(keyMatch[1])] = returnValue;
      return;
    }

    // return the return value
    return returnValue;
  });
}
