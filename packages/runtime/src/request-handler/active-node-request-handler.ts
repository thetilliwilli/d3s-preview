import { ActiveNodeRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class ActiveNodeRequestHandler implements AbstractRequestHandler<ActiveNodeRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<ActiveNodeRequest>): Promise<void> {
    app.networkState.nodes[event.nodeGuid].active = event.active;
  }
}
