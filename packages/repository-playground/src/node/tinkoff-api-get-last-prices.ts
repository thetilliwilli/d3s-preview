import { NodeBuilder } from "@d3s/runtime";
import { TinkoffService } from "../service/tinkoff-service.js";

export const tinkoffApiGetLastPrices = new NodeBuilder()
  .withInput({
    token: "",
    instrumentId: "",
    get: null,
  })
  .withOutput({
    done: null,
    quotation: {
      units: "0",
      nano: 0,
    },
    price: 0,
  })
  .withHandlers({
    async get({ input, signal, emit }) {
      const response = await fetch(
        "https://invest-public-api.tinkoff.ru/rest/tinkoff.public.invest.api.contract.v1.MarketDataService/GetLastPrices",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.token}`,
          },
          body: JSON.stringify({
            instrumentId: [input.instrumentId],
          }),
        }
      );
      const result = await response.json();

      const quotation = result.lastPrices[0].price;
      emit("quotation", quotation);
      emit("price", TinkoffService.toPrice(quotation));
      emit("done", null);
    },
  });
