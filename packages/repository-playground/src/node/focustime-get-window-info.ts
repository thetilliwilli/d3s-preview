import { NodeBuilder } from "@d3s/runtime";
import { UnionLog } from "../domain/log/union-log.js";
import { WindowInfoService } from "../service/window-info-service.js";

export const focustimeGetWindowInfo = new NodeBuilder()
  .withInput({
    run: null,
  })
  .withOutput({
    raw: "",
    log: {
      processName: "",
      id: "",
      appTitle: "",
      time: 0,
    } as UnionLog,
  })
  .withHandlers({
    run({ emit }) {
      const { raw, log } = WindowInfoService.getForegroundWindowInfo();
      emit("raw", raw);
      emit("log", log);
    },
  });
