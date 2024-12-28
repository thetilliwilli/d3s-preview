import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const readFileAsJson = new NodeBuilder()
  .withInput({
    filename: "",
    read: false,
  })
  .withOutput({
    json: {} as any,
    error: "",
  })
  .withHandlers({
    read({ input, emit }) {
      try {
        const json = JSON.parse(fs.readFileSync(input.filename, "utf8"));
        emit("json", json);
      } catch (e) {
        emit("error", e + "");
      }
    },
  });
