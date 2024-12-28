import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const fileRemove = new NodeBuilder()
  .withInput({
    filename: "",
    remove: null,
  })
  .withOutput({})
  .withHandlers({
    remove({ input, emit }) {
      try {
        fs.unlinkSync(input.filename);
      } catch (_) {}
    },
  });
