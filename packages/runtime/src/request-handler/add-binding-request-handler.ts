import { AddBindingRequest } from "@d3s/event";
import { BindingState } from "@d3s/state";
import { GuidService } from "../service/guid-service";
import { AbstractRequestHandler } from "./abstract-request-handler";
import { AbstractRequestHandlerContext } from "./app-event-request-handler";

export class AddBindingRequestHandler implements AbstractRequestHandler<AddBindingRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<AddBindingRequest>): Promise<void> {
    const guid = GuidService.getGuid();

    app.state.bindings[guid] = new BindingState(
      guid,
      event.fromNode,
      event.fromProperty,
      event.toNode,
      event.toProperty
    );

    const fromDataKey = app.state.nodes[event.fromNode].output[event.fromProperty];

    app.state.nodes[event.toNode].input[event.toProperty] = fromDataKey;
  }
}
