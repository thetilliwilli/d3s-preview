import { AddNodeRequest, SendSignalRequest } from "@d3s/event";
import { PositionState, getEmptyNodeState } from "@d3s/state";
import { GuidService } from "../service/guid-service.js";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class AddNodeRequestHandler implements AbstractRequestHandler<AddNodeRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<AddNodeRequest>): Promise<void> {
    const guid = event.guid || GuidService.getGuid();
    const nodeUri = event.nodeUri;

    try {
      const nodebuilder = await app.resolveNode(nodeUri);

      const [runtimeNode, state, input, output] = nodebuilder.build({
        state: event.state,
        input: event.input,
        output: event.output,
      });

      app.nodes[guid] = runtimeNode;

      app.state.nodes[guid] = getEmptyNodeState();

      // meta
      app.state.nodes[guid].meta.guid = guid;
      app.state.nodes[guid].meta.nodeUri = nodeUri;
      app.state.nodes[guid].meta.name = event.name.trim() || nodeUri;
      app.state.nodes[guid].meta.position = event.position || new PositionState(0, 0);
      app.state.nodes[guid].active = true;

      // state
      app.state.nodes[guid].state = Object.fromEntries(Object.entries(state).map((x) => [x[0], app.data.new(x[1])]));

      // input
      app.state.nodes[guid].input = Object.fromEntries(Object.entries(input).map((x) => [x[0], app.data.new(x[1])]));

      // output
      app.state.nodes[guid].output = Object.fromEntries(Object.entries(output).map((x) => [x[0], app.data.new(x[1])]));

      return app.handle(new SendSignalRequest(guid, "_init", null));
    } catch (error) {
      throw new AggregateError([error], `не удалось загрузить нод: ${nodeUri}`, { cause: error });
    }
  }
}
