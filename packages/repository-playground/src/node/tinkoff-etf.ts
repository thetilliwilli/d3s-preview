import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const tinkoffEtf = new NodeBuilder()
  .withInput({
    sharesDbFile: "etfs.json",
    ticker: "",
    figi: "",
  })
  .withOutput({
    figi: "",
    ticker: "",
    currency: "",
    sector: "",
    name: "",
    etf: {} as any,
  })
  .withHandlers({
    ticker({ input, signal, emit }) {
      const share = getShare(input.sharesDbFile, input.ticker);

      if (share !== undefined) {
        emit("ticker", share.ticker);
        emit("figi", share.figi);
        emit("currency", share.currency);
        emit("sector", share.sector);
        emit("name", share.name);
        emit("etf", share);
      }
    },
    figi({ input, signal, emit }) {
      const share = getShare(input.sharesDbFile, input.figi);

      if (share !== undefined) {
        emit("ticker", share.ticker);
        emit("figi", share.figi);
        emit("currency", share.currency);
        emit("sector", share.sector);
        emit("name", share.name);
        emit("etf", share);
      }
    },
  });

function getShare(sharesDbFile: string, tickerOrFigi: string) {
  return JSON.parse(fs.readFileSync(sharesDbFile, "utf8")).find(
    (x: any) => x.ticker === tickerOrFigi || x.figi === tickerOrFigi
  );
}
