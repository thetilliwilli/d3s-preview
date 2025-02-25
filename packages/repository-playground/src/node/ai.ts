import { NodeBuilder } from "@d3s/runtime";

export const ai = new NodeBuilder()
  .withInput({
    code: "input=>0",
    watch: true,
    run: null,
  })
  .withOutput({
    result: "",
    done: null,
    error: "",
  })
  .withHandler(async ({ state, input, signal, instance, emit }) => {
    if (signal.name === "run" || (input.watch && signal.name !== "code" && signal.name !== "watch")) {
      const funcInvokation = eval(`(${input.code})`);
      const results = await funcInvokation(input);
      emit("done", null);
      for (const [name, value] of Object.entries(results)) {
        emit(name as any, value);
      }
    }
  });
