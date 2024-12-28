import fs from "fs";
import { NodeBuilder } from "@d3s/runtime";

export const tinkoffApiGetEtfs = new NodeBuilder()
  .withInput({
    file: "etfs.json",
    token: "",
    get: null,
  })
  .withOutput({
    done: null,
  })
  .withHandlers({
    async get({ input, signal, emit }) {
      const response = await fetch(
        "https://invest-public-api.tinkoff.ru/rest/tinkoff.public.invest.api.contract.v1.InstrumentsService/Etfs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await response.json();
      fs.writeFileSync(input.file, JSON.stringify(result.instruments, null, " "));
      emit("done", null);
    },
  });
