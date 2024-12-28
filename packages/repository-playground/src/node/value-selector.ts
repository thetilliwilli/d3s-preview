import { NodeBuilder } from "@d3s/runtime";

function select(value: any, selector: string, separator: string) {
  const paths = selector.split(separator);
  const result = paths.reduce((obj, path) => obj[path], value);
  return result;
}

export const valueSelector = new NodeBuilder()
  .withInput({
    value: {},
    selector: "",
    separator: ".",
  })
  .withOutput({
    value: null,
  })
  .withHandler(({ input, signal, emit }) => {
    const value = select(input.value, input.selector, input.separator);
    emit("value", value);
  });
