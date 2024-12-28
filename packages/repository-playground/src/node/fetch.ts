import { NodeBuilder } from "@d3s/runtime";

const fetchNode = new NodeBuilder()
  .withInput({
    url: "",
    init: {} as RequestInit,
    fetch: null,
  })
  .withOutput({
    result: "",
    status: 0,
    finished: null,
  })
  .withHandlers({
    async fetch({ input, emit }) {
      const response = await fetch(input.url, input.init);
      const result = await response.text();
      emit("status", response.status);
      emit("result", result);
      emit("finished", null);
    },
  });

export { fetchNode as fetch };
