import { NodeBuilder } from "@d3s/runtime";

export const range = new NodeBuilder()
  .withInput((state) => ({
    from: 0,
    to: 0,
    step: 1,
  }))
  .withOutput((state, input) => ({
    range: [] as number[],
  }))
  .withHandler(({ state, input, signal, emit }) => {
    const range = [];
    for (let i = input.from; i <= input.to; i += input.step) range.push(i);
    emit("range", range);
  });
