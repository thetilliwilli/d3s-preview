import fs from "node:fs";
import { NodeBuilder } from "@d3s/runtime";

export const rm = new NodeBuilder()
  .withInput({
    path: "",
    run: null,
  })
  .withOutput({
    finished: null,
  })
  .withHandlers({
    run({ input, signal, emit }) {
      fs.rmSync(input.path, { force: true, recursive: true });
      emit("finished", null);
    },
  });
