import fs from "fs";
import { NodeBuilder } from "@d3s/runtime";
import { json2csv } from "json-2-csv";

export const jsonToCsv = new NodeBuilder()
  .withInput({
    file: "file.csv",
    items: [] as any[],
    delimiterField: ",",
    delimiterWrap: `"`,
    delimiterEol: "\n",
    write: null,
  })
  .withOutput({
    done: null,
  })
  .withHandlers({
    write({ input, signal, emit }) {
      const content = json2csv(input.items, {
        delimiter: { field: input.delimiterField, wrap: input.delimiterWrap, eol: input.delimiterEol },
      });
      fs.writeFileSync(input.file, content);
      emit("done", null);
    },
  });
