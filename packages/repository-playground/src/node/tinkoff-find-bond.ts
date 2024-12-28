import fs from "fs";
import { NodeBuilder } from "@d3s/runtime";

export const tinkoffFindBond = new NodeBuilder()
  .withInput({
    file: "bonds.json",
    figi: "",
    ticker: "",
    name: "",
  })
  .withOutput({
    bond: {},
  })
  .withHandler(({ input, signal, emit }) => {
    const content = fs.readFileSync(input.file, "utf8");
    const bonds = JSON.parse(content);
    const bond = bonds.find((x: any) => x[signal.name] === signal.data);
    emit("bond", bond);
  });
