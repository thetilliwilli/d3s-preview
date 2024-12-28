import fs from "fs";
import { NodeBuilder } from "@d3s/runtime";
import { csv2json } from "json-2-csv";

export const csvToJsonFile = new NodeBuilder()
  .withInput({
    file: "",
    outfile: "",
    delimiterField: ",",
    delimiterWrap: `"`,
    delimiterEol: "\n",
    read: null,
  })
  .withOutput({
    done: null,
  })
  .withHandlers({
    read({ input, emit }) {
      const content = fs.readFileSync(input.file, "utf8");
      const items = csv2json(content, {
        delimiter: { field: input.delimiterField, wrap: input.delimiterWrap, eol: input.delimiterEol },
      });
      fs.writeFileSync(input.outfile, JSON.stringify(items));
      emit("done", null);
    },
  });
