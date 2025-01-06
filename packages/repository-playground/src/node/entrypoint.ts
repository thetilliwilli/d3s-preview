import { NodeBuilder } from "@d3s/runtime";

export const entrypoint = new NodeBuilder()
  .withInput({
    entry: null,
  })
  .withOutput({
    event: null,
  })
  .withHandlers({
    entry({ state, input, signal, instance, emit }) {
      emit("event", null);
    },
  });
