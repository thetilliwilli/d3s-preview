import { NodeBuilder } from "@d3s/runtime";

export const foreach = new NodeBuilder()
  .withInput({
    items: [] as any[],
  })
  .withOutput({
    item: {} as any,
    iterate: null,
    stop: null,
  })
  .withHandlers({
    items({ state, signal, emit }) {
      signal.data.forEach((item) => {
        emit("item", item);
        emit("iterate", null);
      });
      emit("stop", null);
    },
  });
