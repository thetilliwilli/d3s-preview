import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import path from "path";
import archiver from "archiver";

export const zip = new NodeBuilder()
  .withInput({
    inPath: "",
    outPath: "",
    run: null,
  })
  .withOutput({
    finished: null,
  })
  .withHandlers({
    run({ input, signal, emit }) {
      const output = fs.createWriteStream(input.outPath);
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      output.on("close", function () {
        emit("finished", null);
      });

      archive.pipe(output);

      const isDirectory = fs.statSync(input.inPath).isDirectory();

      if (isDirectory) {
        archive.directory(input.inPath, false);
      } else {
        archive.file(input.inPath, { name: path.basename(input.inPath) });
      }

      archive.finalize();
    },
  });
