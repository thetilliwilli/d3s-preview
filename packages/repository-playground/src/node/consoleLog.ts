import { NodeBuilder } from "@d3s/runtime";

export const consoleLog = new NodeBuilder()
  .withInput({
    text: "",
    log: null,
  })
  .withOutput({
    logged: null,
  })
  .withHandlers({
    log({ state, input, signal, instance, emit }) {
      console.log(input.text);
      emit("logged", null);
    },
  });
