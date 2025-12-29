export function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

export function arrayKeysToCamelCase(arr) {
  return arr.map((obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [toCamelCase(key), value])
    )
  );
}
