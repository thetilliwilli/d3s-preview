import { Dictionary } from "@d3s/utils";
import { Reactor } from "./reactor.js";
import { RunContext } from "./run-context.js";

export class RuntimeNode {
  constructor(
    private handlers: Dictionary<Reactor<Dictionary<any>, Dictionary<any>, Dictionary<any>, string>>,
    private generalHandler: Reactor<Dictionary<any>, Dictionary<any>, Dictionary<any>, string>
  ) {}

  public run(runContext: RunContext): void {
    // hack: todo: skip internal signals
    if (runContext.signal.name[0] !== "_") this.generalHandler(runContext);
    const handler = this.handlers[runContext.signal.name];
    try {
      const result = handler?.(runContext);
      result instanceof Promise
        ? result.catch((error) => runContext.emit("error", error + "")) 
        : null;
    } catch (error) {
      runContext.emit("error", error + "");
    }
  }
}
