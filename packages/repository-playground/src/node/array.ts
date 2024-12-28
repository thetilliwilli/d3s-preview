import { NodeBuilder } from "@d3s/runtime";

export const array = new NodeBuilder()
  .withState({
    array: [] as any[],
  })
  .withInput({
    push: {} as any,
    pushMany: [] as any[],
    clear: null,
  })
  .withOutput((state) => ({
    array: state.array,
  }))
  .withHandlers({
    push({ state, signal, emit }) {
      state.array.push(signal.data);
      emit("array", state.array);
    },
    pushMany({ state, signal, emit }) {
      state.array.push(...signal.data);
      emit("array", state.array);
    },
    clear({ state, signal, emit }) {
      state.array = [];
      emit("array", state.array);
    },
  });
