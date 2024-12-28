import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const toFile = new NodeBuilder()
  .withInput({
    filename: "",
    writeLine: "",
  })
  .withOutput({})
  .withHandlers({
    writeLine({ input, signal, emit }) {
      fs.appendFileSync(input.filename, signal.data + "\n");
    },
  });
