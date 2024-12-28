import { NodeBuilder } from "@d3s/runtime";
import { appendFileSync } from "fs";
import { UnionLog } from "../domain/log/union-log.js";
import { TimeService } from "../service/time-service.js";

export const focustimeSaveLog = new NodeBuilder()
  .withState({
    buffer: [] as string[],
    startTime: Date.now(),
  })
  .withInput({
    log: {
      processName: "",
      id: "",
      appTitle: "",
      time: 0,
    } as UnionLog,
    throttle: 5 * 60,
    lineSeparator: ",\n",
    logDirectory: "logs",
    flushBuffer: null,
  })
  .withOutput({
    logged: null,
  })
  .withHandlers({
    log({ state, input, signal, emit }) {
      const now = Date.now();
      const fileName = TimeService.getTodayFilename(input.logDirectory);

      const logString = JSON.stringify(signal.data);
      state.buffer.push(logString);

      if (now - state.startTime > input.throttle * 1000) {
        state.startTime = now;
        const text = state.buffer.join(input.lineSeparator) + input.lineSeparator;
        appendFileSync(fileName, text, "utf-8");
        state.buffer = [];
        emit("logged", null);
      }
    },
    flushBuffer({ state, input, signal, emit }) {
      const now = Date.now();
      const fileName = TimeService.getTodayFilename(input.logDirectory);

      state.startTime = now;
      const text = state.buffer.join(input.lineSeparator) + input.lineSeparator;
      appendFileSync(fileName, text, "utf-8");
      state.buffer = [];
      emit("logged", null);
    },
  });
