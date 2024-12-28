import { NodeBuilder } from "@d3s/runtime";
import { Endpoint } from "../domain/endpoint.js";
import { endpointService } from "../service/endpoint-service.js";

export const endpointSourceUrls = new NodeBuilder()
  .withInput({
    name: "",
    pipe: "",
    cache: true,
    urls: [] as string[],
    method: "GET",
    headers: {},
    body: null as any,
  })
  .withOutput({
    size: 0,
    pipe: "",
    error: "",
  })
  .withHandlers({
    async pipe({ input, signal, emit }) {
      await endpointService.actionOnEdnpoints({
        ...input,
        action: async () =>
          input.urls.map(
            (url) => new Endpoint({ url, method: input.method, headers: input.headers, body: input.body })
          ),
        emit,
      });
    },
  });
