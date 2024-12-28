import { NodeBuilder } from "@d3s/runtime";

export const arraySlice = new NodeBuilder()
  .withInput({
    array: [] as any[],
    start: 0,
    end: 1,
  })
  .withOutput((_, i) => ({
    array: i.array,
  }))
  .withHandlers({
    array({ input, emit }) {
      emit("array", input.array.slice(input.start, input.end));
    },
    start({ input, emit }) {
      emit("array", input.array.slice(input.start, input.end));
    },
    end({ input, emit }) {
      emit("array", input.array.slice(input.start, input.end));
    },
  });
