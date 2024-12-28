import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const tinkoffShare = new NodeBuilder()
  .withInput({
    sharesDbFile: "shares.json",
    ticker: "",
    figi: "",
  })
  .withOutput((_, input) => ({
    figi: input.figi,
    ticker: input.ticker,
    currency: "",
    sector: "",
    share: {} as any,
  }))
  .withHandler(({ input, signal, emit }) => {
    const share = getShare(input.sharesDbFile, signal.data);

    if (share !== undefined) {
      emit("ticker", share.ticker);
      emit("figi", share.figi);
      emit("currency", share.currency);
      emit("sector", share.sector);
      emit("share", share);
    }
  });

function getShare(sharesDbFile: string, tickerOrFigi: string) {
  return JSON.parse(fs.readFileSync(sharesDbFile, "utf8")).find(
    (x: any) => x.ticker === tickerOrFigi || x.figi === tickerOrFigi
  );
}
