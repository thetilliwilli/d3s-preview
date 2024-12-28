import { UpdateMetaRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler";
import { AbstractRequestHandlerContext } from "./app-event-request-handler";

export class UpdateMetaRequestHandler implements AbstractRequestHandler<UpdateMetaRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<UpdateMetaRequest>): Promise<void> {
    Object.assign(app.state.nodes[event.nodeGuid].meta, event.meta);
  }
}