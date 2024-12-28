import { NodeBuilder } from "@d3s/runtime";

export const arrayFilterMap = new NodeBuilder()
  .withInput({
    array: [] as any[],
    param: "x",
    filter: "",
    map: "",
  })
  .withOutput((_, input) => ({
    array: input.array,
  }))
  .withHandlers({
    array({ input, emit }) {
      emit("array", filter(input.array, input.param, input.filter, input.map));
    },
    param({ input, emit }) {
      emit("array", filter(input.array, input.param, input.filter, input.map));
    },
    filter({ input, emit }) {
      emit("array", filter(input.array, input.param, input.filter, input.map));
    },
    map({ input, emit }) {
      emit("array", filter(input.array, input.param, input.filter, input.map));
    },
  });

function filter(array: any[], param: string, filter: string, map: string): any[] {
  const compiledFilter = new Function(param, `return ${filter}`);
  const compiledMap = new Function(param, `return ${map}`);
  return array.filter((x) => compiledFilter(x)).map((x) => compiledMap(x));
}
