import { NodeBuilder } from "@d3s/runtime";

export const counter = new NodeBuilder()
  .withState({
    value: 0,
  })
  .withInput({
    increment: null,
    dicrement: null,
    reset: null,
  })
  .withOutput((s) => ({
    value: s.value,
  }))
  .withHandlers({
    increment({ state, signal, emit }) {
      state.value += 1;
      emit("value", state.value);
    },
    dicrement({ state, signal, emit }) {
      state.value -= 1;
      emit("value", state.value);
    },
    reset({ state, signal, emit }) {
      state.value = 0;
      emit("value", state.value);
    },
  });
