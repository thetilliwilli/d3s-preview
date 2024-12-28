import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

const watcher = Symbol("watcher");

export const file = new NodeBuilder()
  // .withState({
  //   [watcher]: undefined as fs.FSWatcher | undefined,
  // })
  .withInput({
    filename: "",
    watch: false,
    read: null,
    close: null,
  })
  .withOutput({
    filepath: "",
    changed: null,
    content: "",
    error: "",
    read: null,
  })
  .withHandlers({
    filename({ state, input, emit }) {
      if (!input.watch) return;

      try {
        const content = fs.readFileSync(input.filename, "utf8");
        emit("content", content);
      } catch (error) {
        emit("error", error + "");
      }
    },
    watch({ state, input, instance, emit }) {
      if (!input.watch) instance[watcher]?.close();
      else
        instance[watcher] = fs.watch(input.filename, (eventType) => {
          if (eventType === "change") {
            emit("changed", null);
            const content = fs.readFileSync(input.filename, "utf8");
            emit("content", content);
          }
        });
    },
    read({ state, input, emit }) {
      try {
        const content = fs.readFileSync(input.filename, "utf8");
        emit("content", content);
        emit("read", null);
      } catch (error) {
        emit("error", error + "");
      }
    },
    // hack для очистки контента больших файлов после выполнения запроса по /task
    close({ state, input, emit }) {
      emit("content", "");
    },
  });
