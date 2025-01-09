import { performance } from "perf_hooks";
import { GuidService } from "./guid-service.js";

const getNewId = (
  (index) => () =>
    ++index
)(0); //генератор инкрементирующей последовательности

export class PerformanceService {
  public static watch<T>(action: () => T, name?: string): T {
    const timerName = name || action.name || GuidService.getGuid();
    const timer = new PerformanceTimer(timerName);

    timer.start();
    const result = action();
    timer.stop().measure();
    return result;
  }
}

class PerformanceTimer {
  private id: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.id = getNewId();
  }

  start() {
    performance.mark(this.startMarkName);
    return this;
  }

  stop() {
    performance.mark(this.endMarkName);
    return this;
  }

  measure() {
    performance.measure(this.measureName, this.startMarkName, this.endMarkName);
    return this;
  }

  private get startMarkName() {
    return `${this.name}#${this.id}.start`;
  }

  private get endMarkName() {
    return `${this.name}#${this.id}.end`;
  }

  private get measureName() {
    return `${this.name}#${this.id}`;
  }
}
