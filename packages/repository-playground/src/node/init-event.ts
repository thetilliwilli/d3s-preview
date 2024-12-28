import { NodeBuilder } from "@d3s/runtime";

export const initEvent = new NodeBuilder()
  .withInput({
    _init: null,
  })
  .withOutput((state) => ({
    init: null,
  }))
  .withHandlers({
    _init({ state, signal, emit }) {
      emit("init", null);
    },
  });
