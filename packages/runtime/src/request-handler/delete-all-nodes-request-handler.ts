import { DeleteAllNodesRequest, DeleteBindingRequest, DeleteNodeRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class DeleteAllNodesRequestHandler implements AbstractRequestHandler<DeleteAllNodesRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<DeleteAllNodesRequest>): Promise<void> {
    await Promise.all(Object.values(app.state.nodes).map((node) => app.handle(new DeleteNodeRequest(node.meta.guid))));
    await Promise.all(Object.values(app.state.bindings).map((x) => app.handle(new DeleteBindingRequest(x.guid))));
  }
}
