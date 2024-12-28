import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import { HarEntry } from "../domain/har-entry.js";

export const harToDataScience = new NodeBuilder()
  .withInput({
    input: "",
    output: "",
    mimeTypes: [] as string[],
    run: null,
  })
  .withOutput({
    done: null,
  })
  .withHandlers({
    run({ state, input, signal, emit }) {
      const entries = JSON.parse(fs.readFileSync(input.input, "utf8")).log.entries;

      const result = entries
        .filter((x: any) => {
          const mimeType = new HarEntry(x).getResponseMimeType();
          return input.mimeTypes.includes(mimeType);
        })
        .map((x: any) => {
          return {
            url: x.request.url,
            responseData: new HarEntry(x).getResponseData(),
          };
        });

      fs.writeFileSync(input.output, JSON.stringify(result));

      emit("done", null);
    },
  });
