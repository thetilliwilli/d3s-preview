import { DeleteBindingRequest, DeleteNodeRequest, SendSignalRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class DeleteNodeRequestHandler implements AbstractRequestHandler<DeleteNodeRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<DeleteNodeRequest>): Promise<void> {
    await app.handle(new SendSignalRequest(event.nodeGuid, "_destroy", null));

    delete app.nodes[event.nodeGuid];
    delete app.networkState.nodes[event.nodeGuid];

    const bindings = Object.values(app.networkState.bindings);

    const outboundBindings = bindings.filter((x) => x.from.node === event.nodeGuid);
    const inboundBindings = bindings.filter((x) => x.to.node === event.nodeGuid);

    const tasks = outboundBindings
      .concat(inboundBindings)
      .map((binding) => app.handle(new DeleteBindingRequest(binding.guid)));

    await Promise.all(tasks);
  }
}
