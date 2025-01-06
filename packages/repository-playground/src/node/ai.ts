import { NodeBuilder } from "@d3s/runtime";

export const ai = new NodeBuilder()
  .withInput({
    code: "input=>0",
    run: null,
  })
  .withOutput({
    result: "",
    done: null,
    error: "",
  })
  .withHandlers({
    async run({ state, input, signal, instance, emit }) {
      const funcInvokation = await eval(`(${input.code})`);
      const results = await funcInvokation(input);
      for (const [name, value] of Object.entries(results)) {
        emit(name as any, value);
      }
    },
  });