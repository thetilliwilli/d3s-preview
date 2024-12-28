import { NodeBuilder } from "@d3s/runtime";

const timerId = Symbol("timerId");

export const timer = new NodeBuilder()
  .withState({
    // [timerId]: undefined as any,
    count: 0,
  })
  .withInput({
    /** seconds */
    interval: 1,
    times: -1,
    start: null,
    stop: null,
    _destroy: null,
  })
  .withOutput({
    event: null,
  })
  .withHandlers({
    start({ state, input, signal, instance, emit }) {
      state.count = 0;
      clearInterval(instance[timerId]);

      const ms = input.interval * 1000;

      instance[timerId] = setInterval(() => {
        emit("event", null);
        state.count++;
        const realTimes = input.times === -1 ? Number.MAX_SAFE_INTEGER : input.times;
        if (state.count >= realTimes) clearInterval(instance[timerId]);
      }, ms);
    },
    stop({ state, signal,instance, emit }) {
      state.count = 0;
      clearInterval(instance[timerId]);
    },
    _destroy({ state, input, signal, instance, emit }) {
      state.count = 0;
      clearInterval(instance[timerId]);
    },
  });
