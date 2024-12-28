import { NodeBuilder } from "@d3s/runtime";

const timerId = Symbol("timerId");

export const at = new NodeBuilder()
  .withState({
    ready: false,
  })
  .withInput({
    /** seconds */
    interval: 300,
    at: "1970-01-01T00:00:00.000Z",
    start: null,
    reset: null,
  })
  .withOutput((s) => ({
    ready: s.ready,
    event: null,
  }))
  .withHandlers({
    start({ state, input, instance, emit }) {
      clearInterval(instance[timerId]);
      instance[timerId] = setInterval(() => {
        if (!state.ready) {
          if (new Date(input.at).getTime() - new Date().getTime() < 0) {
            clearInterval(instance[timerId]);
            state.ready = true;
            emit("ready", true);
            emit("event", null);
          }
        }
      }, input.interval * 1000);
    },
    reset({ state, input, instance, emit }) {
      clearInterval(instance[timerId]);
      state.ready = false;
    },
  });
