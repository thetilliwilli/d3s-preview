import { NodeBuilder } from "@d3s/runtime";
import { endpointService, VarTuple } from "../service/endpoint-service.js";

export const endpointTransformInjectVars = new NodeBuilder()
  .withInput((state) => ({
    pipe: "",
    name: "",
    cache: false,
    vars: [] as VarTuple[],
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
        action: async (endpoints) => endpoints.flatMap((endpoint) => endpointService.replaceVars(endpoint, input.vars)),
        emit,
      });
    },
  });
