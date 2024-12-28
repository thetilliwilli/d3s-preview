import process from "process";
import { NodeBuilder } from "@d3s/runtime";

export const processInfo = new NodeBuilder()
  .withInput({
    get: null,
  })
  .withOutput({
    processInfo: {} as any,
    time: "",
  })
  .withHandlers({
    get({ state, signal, emit }) {
      emit("time", new Date().toISOString());

      const processInfo = {
        event: process.env.npm_lifecycle_event,
        version: process.version,
        arch: process.arch,
        platform: process.platform,
        features: process.features,
        env: process.env,
        title: process.title,
        argv: process.argv,
        execArgv: process.execArgv,
        pid: process.pid,
        ppid: process.ppid,
        execPath: process.execPath,
        debugPort: process.debugPort,
        argv0: process.argv0,
        //@ts-ignore
        _preload_modules: process._preload_modules,
        //@ts-ignore
        getActiveResourcesInfo: process.getActiveResourcesInfo(),
      };

      emit("processInfo", processInfo);
    },
  });
