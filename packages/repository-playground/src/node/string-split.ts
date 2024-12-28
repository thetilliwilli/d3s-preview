import { NodeBuilder } from "@d3s/runtime";

export const stringSplit = new NodeBuilder()
  .withInput({
    input: "",
    splitter: "",
    run: null,
  })
  .withOutput({
    items: [] as any[],
  })
  .withHandlers({
    run({ input, signal, emit }) {
      emit("items", input.input.split(input.splitter));
    },
  });
