import { AddNodeRequest, DeleteNodeRequest, eventNames, InvokeNodeRequest, SendSignalRequest } from "@d3s/event";
import { Signal } from "../domain/node/signal.js";
import { GuidService } from "../service/guid-service.js";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class InvokeNodeRequestHandler implements AbstractRequestHandler<InvokeNodeRequest, any> {
  public async handle({ app, event }: AbstractRequestHandlerContext<InvokeNodeRequest>): Promise<any> {
    // создать нод
    const tempNodeGuid = GuidService.getGuid();
    const addNodeRequest = new AddNodeRequest(event.nodeUri);
    addNodeRequest.input = event.input;
    addNodeRequest.guid = tempNodeGuid;
    await app.handle(addNodeRequest);
    return new Promise((resolve, reject) => {
      app.once(eventNames.outboundSignal, (signal: Signal) => {
        if (signal.nodeGuid === tempNodeGuid && signal.type === "output" && signal.name === event.output) {
          // удалить нод
          app.handle(new DeleteNodeRequest(tempNodeGuid));

          // вернуть результат
          resolve(app.getData({ nodeGuid: tempNodeGuid, scope: "output", property: event.output }));
        }
      });
      // вызвать node.run
      const sendSignalRequest = new SendSignalRequest(tempNodeGuid, event.invoke, "input");
      app.handle(sendSignalRequest);
    });
  }
}
