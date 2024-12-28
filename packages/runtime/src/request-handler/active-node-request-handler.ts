import { ActiveNodeRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler";
import { AbstractRequestHandlerContext } from "./app-event-request-handler";

export class ActiveNodeRequestHandler implements AbstractRequestHandler<ActiveNodeRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<ActiveNodeRequest>): Promise<void> {
    app.state.nodes[event.nodeGuid].active = event.active;
  }
}
