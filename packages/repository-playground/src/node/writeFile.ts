import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const writeFile = new NodeBuilder()
  .withInput({
    file: "",
    content: "",
    replace: false,
    append: false,
    writeLineMode: false,
    write: null,
  })
  .withOutput({
    done: null,
    error: "",
  })
  .withHandlers({
    write({ input, emit }) {
      try {
        const mode = (input.append ? "a" : "w") + (input.replace ? "" : "x");
        const content = input.writeLineMode ? input.content + "\n" : input.content;
        fs.writeFileSync(input.file, content, { flag: mode });
        emit("done", null);
      } catch (error) {
        emit("error", error + "");
        if (error instanceof Error && "code" in error && error.code !== "EEXIST") throw error;
      }
    },
  });
