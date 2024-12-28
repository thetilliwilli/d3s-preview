import { NodeBuilder } from "@d3s/runtime";
import { parse } from "node-html-parser";

export const htmlParser = new NodeBuilder()
  .withState({})
  .withInput((state) => ({
    html: "",
    querySelectorAll: "",
    selectors: [] as string[],
    run: null,
  }))
  .withOutput((state, input) => ({
    result: [] as any[],
  }))
  .withHandlers({
    run({ state, input, signal, emit }) {
      const root = parse(input.html);
      const entries = root.querySelectorAll(input.querySelectorAll);
      const result = entries.map((x: any) => {
        const item = Object.fromEntries(input.selectors.map((selector) => [selector, x[selector]]));
        return item;
      });
      emit("result", result);
    },
  });
