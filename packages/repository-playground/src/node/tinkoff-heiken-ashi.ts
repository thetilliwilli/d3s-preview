import { NodeBuilder } from "@d3s/runtime";

type Candle = { open: number; high: number; low: number; close: number; volume: number; time: string };

export const tinkoffHeikenAshi = new NodeBuilder()
  .withInput({
    marketData: [] as Candle[],
  })
  .withOutput({
    heikenAshi: [] as Candle[],
  })
  .withHandlers({
    marketData({ state, signal, emit }) {
      const result = signal.data.reduce((acc, cur, i, ar) => {
        acc.push(ashi(cur, i === 0 ? cur : acc[i - 1]));
        return acc;
      }, [] as Candle[]);
      emit("heikenAshi", result);
    },
  });

function ashi(currentCandle: Candle, previousAshi: Candle) {
  const close = (currentCandle.open + currentCandle.high + currentCandle.low + currentCandle.close) / 4;
  const open = (previousAshi.open + previousAshi.close) / 2;
  const high = Math.max(currentCandle.high, open, close);
  const low = Math.min(currentCandle.low, open, close);
  const volume = currentCandle.volume;
  const time = currentCandle.time;
  return {
    close,
    open,
    high,
    low,
    volume,
    time,
  };
}
