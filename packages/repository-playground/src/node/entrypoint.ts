import { NodeBuilder } from "@d3s/runtime";

export const entrypoint = new NodeBuilder()
  .withInput({} as { [name: string]: any })
  .withOutput({} as { [name: string]: any })
  .withHandler(({ state, input, signal, instance, emit }) => {
    emit(signal.name, signal.data);
  });