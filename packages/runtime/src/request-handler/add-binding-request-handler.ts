import { AddBindingRequest } from "@d3s/event";
import { BindingState } from "@d3s/state";
import { GuidService } from "../service/guid-service.js";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class AddBindingRequestHandler implements AbstractRequestHandler<AddBindingRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<AddBindingRequest>): Promise<void> {
    const guid = GuidService.getGuid();

    app.networkState.bindings[guid] = new BindingState(
      guid,
      event.fromNode,
      event.fromProperty,
      event.toNode,
      event.toProperty
    );

    const fromDataKey = app.networkState.nodes[event.fromNode].output[event.fromProperty];

    app.networkState.nodes[event.toNode].input[event.toProperty] = fromDataKey;
  }
}
