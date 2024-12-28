import { NodeBuilder } from "@d3s/runtime";

export const string = new NodeBuilder()
  .withInput({
    value: "",
  })
  .withOutput({
    value: "",
    changed: null,
  })
  .withHandlers({
    value({ signal, input, emit }) {
      const isChanged = signal.data !== input.value;
      input.value = signal.data;
      emit("value", input.value);
      if (isChanged) emit("changed", null);
    },
  });
