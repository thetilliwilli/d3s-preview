import { NodeBuilder } from "@d3s/runtime";

export const jsonParse = new NodeBuilder()
  .withInput({ input: "" })
  .withOutput({ output: {} as any })
  .withHandlers({
    input({ state, signal, emit }) {
      emit("output", JSON.parse(signal.data));
    },
  });
