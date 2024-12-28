import { NodeBuilder } from "@d3s/runtime";

export const throttle = new NodeBuilder()
  .withState({
    lastTime: Date.now(),
  })
  .withInput({
    input: {} as any,
    /** milliseconds */
    timeout: 0,
  })
  .withOutput({
    output: {} as any,
  })
  .withHandlers({
    input({ state, input, signal, emit }) {
      const now = Date.now();
      if (now - state.lastTime > input.timeout) {
        state.lastTime = now;
        emit("output", input.input);
      }
    },
  });
