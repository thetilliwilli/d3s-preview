import { NodeBuilder } from "@d3s/runtime";
import { parse } from "node-html-parser";

export const rbcCashParser = new NodeBuilder()
  .withInput({ html: "" })
  .withOutput({
    result: [] as any[],
    min: {} as any,
    minPrice: Number.MAX_SAFE_INTEGER,
    maxSell: {} as any,
    maxSellPrice: 0,
  })
  .withHandlers({
    html({ state, signal, emit }) {
      const time = new Date().toISOString();

      const result = [];

      let minResult = {
        officeName: "",
        buyPrice: Number.MAX_VALUE,
        sellPrice: 0,
        metro: "",
        distance: "",
        time,
      };

      let maxSellResult = minResult;

      const root = parse(signal.data);
      const entries = root.querySelectorAll(
        ".quote__office__content.js-office-content>.quote__office__one.js-one-office"
      );
      for (const entry of entries) {
        const officeName = entry.querySelector(".quote__office__one__name")?.textContent || "";

        const buyPriceString = entry
          .querySelector(".quote__office__one__buy")
          ?.textContent.split("\n")
          .map((x) => x.trim())
          .filter((x) => x !== "")[0];

        const buyPrice = buyPriceString ? Number.parseFloat(buyPriceString) : NaN;

        const sellPriceString = entry
          .querySelector(".quote__office__one__sell")
          ?.textContent.split("\n")
          .map((x) => x.trim())
          .filter((x) => x !== "")[0];

        const sellPrice = sellPriceString ? Number.parseFloat(sellPriceString) : NaN;

        const [metro, distance] = entry
          .querySelector(".quote__office__one__metro")
          ?.textContent.split("\n")
          .map((x) => x.trim())
          .filter((x) => x !== "") as [string, string];

        const resultItem = {
          officeName,
          buyPrice,
          sellPrice,
          metro,
          distance,
          time,
        };

        if (resultItem.buyPrice < minResult.buyPrice) minResult = resultItem;
        if (resultItem.sellPrice > maxSellResult.sellPrice) maxSellResult = resultItem;

        result.push(resultItem);
      }

      emit("result", result);

      emit("min", minResult);
      emit("minPrice", minResult.buyPrice);

      emit("maxSell", maxSellResult);
      emit("maxSellPrice", maxSellResult.sellPrice);
    },
  });
