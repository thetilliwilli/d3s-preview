import { NodeBuilder } from "@d3s/runtime";
import { Endpoint } from "../domain/endpoint.js";
import { endpointService } from "../service/endpoint-service.js";

export const endpointTransform = new NodeBuilder()
  .withInput((state) => ({
    pipe: "",
    name: "",
    cache: false,
    transform: "(items, Endpoint, input) => items",
  }))
  .withOutput((state, input) => ({
    size: 0,
    pipe: "",
    error: "",
  }))
  .withHandlers({
    async pipe({ state, input, signal, instance, emit }) {
      await endpointService.actionOnEdnpoints({
        ...input,
        action: async (endpoints: Endpoint[]) =>
          new Function("endpoints", "Endpoint", "input", `return (${input.transform})(endpoints, Endpoint, input)`)(
            endpoints,
            Endpoint,
            input
          ),
        emit,
      });
    },
  });
