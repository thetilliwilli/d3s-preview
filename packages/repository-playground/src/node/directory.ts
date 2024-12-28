import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import path from "path";

export const directory = new NodeBuilder()
  .withInput({
    path: ".",
    read: null,
  })
  .withOutput({
    files: [] as string[],
  })
  .withHandlers({
    path({ input, emit }) {
      const files = fs.readdirSync(input.path).map((filePath) => path.join(input.path, filePath));
      emit("files", files);
    },
    read({ input, emit }) {
      const files = fs.readdirSync(input.path).map((filePath) => path.join(input.path, filePath));
      emit("files", files);
    },
  });
