import fs from "fs";
import { NodeBuilder } from "@d3s/runtime";

export const tinkoffApiGetCandles = new NodeBuilder()
  .withInput({
    file: "candles.json",
    token: "",
    from: "2024-01-01T00:00:00Z",
    to: "2024-01-14T00:00:00Z",
    interval: 5,
    instrumentId: "",
    completeOnly: true,
    mergeMode: false,
    get: null,
  })
  .withOutput({
    done: null,
  })
  .withHandlers({
    async get({ input, signal, emit }) {
      const response = await fetch(
        "https://invest-public-api.tinkoff.ru/rest/tinkoff.public.invest.api.contract.v1.MarketDataService/GetCandles",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.token}`,
          },
          body: JSON.stringify({
            from: input.from,
            to: input.to,
            interval: input.interval,
            instrumentId: input.instrumentId,
          }),
        }
      );
      const oldCandles: any[] = input.mergeMode ? getOldCandles(input.file) : [];
      const newCandles: any[] = (await response.json()).candles;

      newCandles.forEach((newCandle) => {
        const oldCandleIndex = oldCandles.findIndex((x) => x.time === newCandle.time);
        if (oldCandleIndex === -1) oldCandles.push(newCandle); // добавляем новую свечу
        else oldCandles[oldCandleIndex] = newCandle; // перезаписываем полностью свечу - так как последние полученные данные считаем более свежими
      });

      fs.writeFileSync(input.file, JSON.stringify(oldCandles));
      emit("done", null);
    },
  });

function getOldCandles(file: string): any[] {
  try {
    const content = fs.readFileSync(file, "utf8");
    return JSON.parse(content);
  } catch (_) {
    return [];
  }
}
