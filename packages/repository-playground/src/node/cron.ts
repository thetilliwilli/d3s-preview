import { NodeBuilder } from "@d3s/runtime";
import { CronJob } from "cron";

const task = Symbol("task");

export const cron = new NodeBuilder()
  .withState({
    // schedule: "",
    isRunning: false,
    // [task]: undefined as CronJob<() => void, null> | undefined,
  })
  .withInput({
    schedule: "* * * * * *",
    _init: null,
    _destroy: null,
    start: null,
    stop: null,
  })
  .withOutput({
    event: null,
    next: "",
  })
  .withHandlers({
    schedule({ state, input, instance, emit }) {
      // instance[signal.name] = signal.data;
      if (state.isRunning && input.schedule !== "") {
        startTask(instance, input, emit);
      }
    },
    _init({ state, input, instance, emit }) {
      if (state.isRunning && input.schedule !== "") {
        startTask(instance, input, emit);
      }
    },
    _destroy({ state, signal, instance, emit }) {
      instance[task]?.stop();
      state.isRunning = false;
    },
    start({ state, input, instance, emit }) {
      startTask(instance, input, emit);
      state.isRunning = true;
    },
    stop({ state, signal, instance, emit }) {
      instance[task]?.stop();
      state.isRunning = false;
      emit("next", "");
    },
  });

function startTask(instance: any, input: any, emit: (signalName: any, data: any) => void) {
  instance[task]?.stop();

  instance[task] = CronJob.from({
    cronTime: input.schedule,
    onTick: () => {
      emit("event", null);
      const nextDate = instance[task]?.nextDate().toISO() || "";
      emit("next", nextDate);
    },
    start: true,
  });

  const nextDate = instance[task]?.nextDate().toISO() || "";
  emit("next", nextDate);
}
