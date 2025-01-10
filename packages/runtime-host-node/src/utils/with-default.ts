export function withDefault<T>(cast: (value: unknown) => T | undefined, unknownValue: unknown, defaultValue: T) {
  const value = cast(unknownValue);
  return value === undefined ? defaultValue : value;
}
