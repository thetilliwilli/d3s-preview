export const toNumber = (x: unknown) => {
  const castedX = Number.parseInt(x + "");
  return Number.isFinite(castedX) ? castedX : undefined;
};
export const toString = (x: unknown) => (typeof x === "string" ? x : undefined);
export const toBoolean = (x: unknown) => (x === "true" ? true : x === "false" ? false : undefined);
