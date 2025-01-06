import { NodeBuilder } from "@d3s/runtime";

export const processExit = new NodeBuilder()
  .withInput({
    code: 0,
    exit: null,
  })
  .withOutput({})
  .withHandlers({
    exit({ state, input, signal, instance, emit }) {
      process.exit(input.code);
    },
  });
