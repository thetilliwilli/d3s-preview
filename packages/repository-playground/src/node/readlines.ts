import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

const lines = Symbol("lines");

export const readlines = new NodeBuilder()
  .withState({
    cursor: -1,
    // [lines]: [] as string[],
  })
  .withInput({
    filename: "",
    skipEmpty: false,
    open: null,
    next: null,
  })
  .withOutput({
    line: "",
    lineCount: 0,
    cursor: 0,
    iterated: null,
    eof: null,
  })
  .withHandlers({
    open({ state, input, signal, instance, emit }) {
      instance[lines] = fs
        .readFileSync(input.filename, "utf8")
        .split("\n")
        .filter((x) => (input.skipEmpty ? x.trim() !== "" : true));

      emit("lineCount", instance[lines].length);

      state.cursor = 0;
      emit("cursor", state.cursor);
    },
    next({ state, signal, instance, emit }) {
      if (state.cursor === -1) return;
      if (state.cursor === instance[lines].length) {
        emit("eof", null);
        state.cursor = -1;
      } else {
        emit("line", instance[lines][state.cursor++]);
        emit("cursor", state.cursor);
        emit("iterated", null);
      }
    },
  });
