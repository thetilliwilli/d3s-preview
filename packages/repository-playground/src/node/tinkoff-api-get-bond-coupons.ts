import { NodeBuilder } from "@d3s/runtime";

export const tinkoffApiGetBondCoupons = new NodeBuilder()
  .withInput({
    token: "",
    instrumentId: "",
    from: "2000-01-01T00:00:00.000+03:00",
    to: "2099-12-31T23:59:59.999+03:00",
    get: null,
  })
  .withOutput({
    done: null,
    bondCoupons: [],
  })
  .withHandlers({
    async get({ input, signal, emit }) {
      const response = await fetch(
        "https://invest-public-api.tinkoff.ru/rest/tinkoff.public.invest.api.contract.v1.InstrumentsService/GetBondCoupons",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.token}`,
          },
          body: JSON.stringify({
            from: input.from || undefined,
            to: input.to || undefined,
            instrumentId: input.instrumentId,
          }),
        }
      );
      const result = await response.json();
      emit("bondCoupons", result.events);
      emit("done", null);
    },
  });
