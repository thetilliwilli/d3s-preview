import { NodeBuilder } from "@d3s/runtime";

export const iterate = new NodeBuilder()
  .withState({
    index: -1,
  })
  .withInput({
    items: [] as any[],
    reset: null,
    next: null,
    iterate: null,
  })
  .withOutput({
    item: {} as any,
    iterated: null,
    finished: null,
  })
  .withHandlers({
    items({ state, signal, emit }) {
      state.index = 0;
    },
    reset({ state, signal, emit }) {
      state.index = 0;
    },
    next({ state, input, signal, emit }) {
      if (state.index >= input.items.length) emit("finished", null);
      else {
        emit("item", input.items[state.index++]);
        emit("iterated", null);
      }
    },
    iterate({ state, input, signal, emit }) {
      input.items.forEach((item) => {
        emit("item", item);
        emit("iterated", null);
      });
      emit("finished", null);
    },
  });
