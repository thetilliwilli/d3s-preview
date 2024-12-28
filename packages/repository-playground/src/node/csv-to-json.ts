import fs from "fs";
import { NodeBuilder } from "@d3s/runtime";
import { csv2json } from "json-2-csv";

export const csvToJson = new NodeBuilder()
  .withInput({
    file: "file.csv",
    delimiterField: ",",
    delimiterWrap: `"`,
    delimiterEol: "\n",
    script: "return items",
    encoding: "utf8" as BufferEncoding,
    excelBOM: false,
    read: null,
  })
  .withOutput({
    items: [] as any[],
  })
  .withHandlers({
    read({ input, emit }) {
      const content = fs.readFileSync(input.file).toString(input.encoding);
      let items = csv2json(content, {
        delimiter: { field: input.delimiterField, wrap: input.delimiterWrap, eol: input.delimiterEol },
        excelBOM: input.excelBOM,
      });
      items = Function("items", input.script.trim() === "" ? "return items" : input.script)(items);
      emit("items", items);
    },
  });
