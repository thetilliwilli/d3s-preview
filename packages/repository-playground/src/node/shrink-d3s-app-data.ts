import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";

export const shrinkD3sAppData = new NodeBuilder()
  .withInput({
    filename: "",
    shrink: null,
    clear: null,
  })
  .withOutput({
    result: {},
    error: "",
  })
  .withHandlers({
    shrink({ state, input, emit }) {
      const app = JSON.parse(fs.readFileSync(input.filename, "utf8"));

      const keyMap: any = {}; //old to new DataKey mapping
      const shrinkedData: any = [];

      Object.values(app.state.nodes)
        .flatMap((node: any) => [node.input, node.state, node.output])
        .forEach((obj) => {
          for (const propName in obj) {
            const oldDataKey = obj[propName];

            if (!keyMap[oldDataKey]) {
              keyMap[oldDataKey] = shrinkedData.length;
              shrinkedData.push(app.data[oldDataKey]);
            }

            obj[propName] = keyMap[oldDataKey];
          }
        });

      app.data = shrinkedData;

      emit("result", app);
    },
    clear({ state, input, emit }) {
      emit("result", {});
    },
  });
