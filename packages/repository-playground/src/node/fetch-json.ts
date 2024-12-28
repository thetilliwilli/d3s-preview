import { NodeBuilder } from "@d3s/runtime";

export const fetchJson = new NodeBuilder()
  .withInput({
    url: "",
    pre: "(function(){return {}})()",
    post: "(function(){return response})()",
    fetch: null,
  })
  .withOutput({
    result: "",
    status: 0,
    finished: null,
  })
  .withHandlers({
    async fetch({ input, emit }) {
      const init = eval(input.pre);
      const fetchResponse = await fetch(input.url, init);
      const response = await fetchResponse.json();
      const result = eval(input.post);
      emit("status", fetchResponse.status);
      emit("result", result);
      emit("finished", null);
    },
  });
