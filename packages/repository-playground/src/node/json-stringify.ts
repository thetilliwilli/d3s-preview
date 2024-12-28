import { NodeBuilder } from "@d3s/runtime";

export const jsonStringify = new NodeBuilder()
  .withInput({
    input: {} as any,
    pretty: false,
  })
  .withOutput({
    output: "",
  })
  .withHandlers({
    input({ input, signal, emit }) {
      const output = input.pretty ? JSON.stringify(signal.data, null, 1) : JSON.stringify(signal.data);
      emit("output", output);
    },
  });
