import { NodeBuilder } from "@d3s/runtime";

export const number = new NodeBuilder()
  .withState({
    value: 0,
  })
  .withInput((state) => ({
    value: state.value,
    increment: null,
    dicrement: null,
  }))
  .withOutput((state) => ({
    value: state.value,
    changed: null,
  }))
  .withHandlers({
    value({ signal, state, emit }) {
      const isChanged = signal.data !== state.value;
      state.value = signal.data;
      emit("value", state.value);
      if (isChanged) emit("changed", null);
    },
    increment({ emit, state }) {
      state.value += 1;
      emit("value", state.value);
      emit("changed", null);
    },
    dicrement({ emit, state }) {
      state.value -= 1;
      emit("value", state.value);
      emit("changed", null);
    },
  });
