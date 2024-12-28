import { NodeBuilder } from "@d3s/runtime";

export const event = new NodeBuilder()
  .withInput({
    invoke: null,
  })
  .withOutput({
    event: null,
  })
  .withHandlers({
    invoke({ state, signal, emit }) {
      emit("event", null);
    },
  });
