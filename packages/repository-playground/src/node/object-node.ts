import { NodeBuilder } from "@d3s/runtime";

export const object = new NodeBuilder()
  .withInput({
    value: {} as any,
  })
  .withOutput((state) => ({
    value: {} as any,
    changed: null,
  }))
  .withHandlers({
    value({ signal, input, emit }) {
      emit("value", input.value);
      emit("changed", null);
    },
  });
