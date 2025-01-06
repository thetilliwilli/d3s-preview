import { LoadNetworkRequest, SendSignalRequest } from "@d3s/event";
import { BindingState, NodeState } from "@d3s/state";
import { AbstractRequestHandler } from "./abstract-request-handler";
import { AbstractRequestHandlerContext } from "./app-event-request-handler";

export class LoadNetworkRequestHandler implements AbstractRequestHandler<LoadNetworkRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<LoadNetworkRequest>): Promise<void> {
    const networkState = event.networkState;

    // переделать последовательность _addNodeHandelr -> initSignal
    Object.values(networkState.bindings).forEach((bindingState) => {
      app.state.bindings[bindingState.guid] = new BindingState(
        bindingState.guid,
        bindingState.from.node,
        bindingState.from.property,
        bindingState.to.node,
        bindingState.to.property
      );
    });

    await Promise.all(
      Object.values(networkState.nodes).map(async (nodeState) => {
        const nodebuilder = await app.resolveNode(nodeState.meta.nodeUri);

        const [runtimeNode] = nodebuilder.build({
          state: nodeState.state,
          input: nodeState.input,
          output: nodeState.output,
        });

        app.nodes[nodeState.meta.guid] = runtimeNode;

        app.state.nodes[nodeState.meta.guid] = new NodeState(
          nodeState.meta,
          nodeState.state,
          nodeState.input,
          nodeState.output,
          nodeState.active
        );
      })
    );

    await Promise.all(
      Object.values(networkState.nodes).map((nodeState) =>
        app.handle(new SendSignalRequest(nodeState.meta.guid, "_init", null, "input"))
      )
    );

    app.state.repository = event.networkState.repository;

    const entrypointNode = Object.values(app.state.nodes).find(
      (node) => node.meta.nodeUri === "@d3s/repository-playground.entrypoint"
    );

    if (entrypointNode) {
      await app.handle(new SendSignalRequest(entrypointNode.meta.guid, "entry", null, "input"));
    }
  }
}
