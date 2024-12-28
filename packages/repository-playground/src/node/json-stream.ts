import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const jsonStream = new NodeBuilder()
  .withInput({
    filename: "",
    open: null,
    take: 1,
    skip: 0,
  })
  .withOutput((s, i) => ({
    filepath: i.filename,
    item: {} as any,
  }))
  .withHandlers({
    open({ input, signal, emit }) {
      const content = fs.readFileSync(input.filename, "utf8");
      const jsonArray = JSON.parse(content);
      if (Array.isArray(jsonArray))
        jsonArray.slice(input.skip, input.take === -1 ? undefined : input.skip + input.take).forEach((item) => {
          emit("item", item);
        });
    },
  });
