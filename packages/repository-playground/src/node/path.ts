import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import path from "path";

type EntryType = "file" | "directory" | "";

const pathNode = new NodeBuilder()
  .withInput({
    path: "",
  })
  .withOutput({
    info: {
      path: "",
      fullPath: "",
      type: "" as EntryType,
      size: 0,
      directory: "",
      basename: "",
      name: "",
      ext: "",
      exists: false,
    },
    error: "",
  })
  .withHandlers({
    path({ state, signal, emit }) {
      try {
        const fullPath = path.resolve(signal.data);
        const stat = fs.statSync(fullPath);
        let type: EntryType = "";
        if (stat.isFile()) type = "file";
        if (stat.isDirectory()) type = "directory";
        const ext = path.extname(fullPath);

        emit("info", {
          path: signal.data,
          fullPath: fullPath,
          type: type,
          size: stat.size,
          directory: path.dirname(fullPath),
          basename: path.basename(fullPath),
          name: path.basename(fullPath, ext),
          ext: ext.slice(1),
          exists: true,
        });
        emit("error", "");
      } catch (error) {
        emit("info", {
          path: "",
          fullPath: "",
          type: "",
          size: -1,
          directory: "",
          basename: "",
          name: "",
          ext: "",
          exists: false,
        });
        emit("error", error + "");
      }
    },
  });

export { pathNode as path };
