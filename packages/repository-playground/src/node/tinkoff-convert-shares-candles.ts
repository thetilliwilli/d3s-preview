import fs from "fs";
import { NodeBuilder } from "@d3s/runtime";
import { TinkoffService } from "../service/tinkoff-service.js";

export const tinkoffConvertSharesCandles = new NodeBuilder()
  .withInput({
    fileIn: "shares.json",
    fileOut: "shares-out.json",
    convert: null,
  })
  .withOutput({})
  .withHandlers({
    convert({ input, signal, emit }) {
      const content = fs.readFileSync(input.fileIn, "utf8");
      const items = JSON.parse(content).map((x: any) => {
        x.open = TinkoffService.toPrice(x.open);
        x.high = TinkoffService.toPrice(x.high);
        x.low = TinkoffService.toPrice(x.low);
        x.close = TinkoffService.toPrice(x.close);
        x.volume = Number.parseInt(x.volume);
        delete x.isComplete;
        return x;
      });
      fs.writeFileSync(input.fileOut, JSON.stringify(items));
    },
  });
