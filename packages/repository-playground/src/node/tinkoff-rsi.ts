import { NodeBuilder } from "@d3s/runtime";
import TaMath from "ta-math";

export const tinkoffRsi = new NodeBuilder()
  .withInput({
    marketData: [] as { open: number; high: number; low: number; close: number; volume: number; time: string }[],
  })
  .withOutput({
    rsi: [] as number[],
  })
  .withHandlers({
    marketData({ state, signal, emit }) {
      const marketData: [string, number, number, number, number, number][] = signal.data.map((x) => [
        x.time,
        x.open,
        x.high,
        x.low,
        x.close,
        x.volume,
      ]);

      const taMath = new TaMath.default(marketData, TaMath.default.exchangeFormat);
      const rsi = taMath.rsi();
      emit("rsi", rsi);
    },
  });
