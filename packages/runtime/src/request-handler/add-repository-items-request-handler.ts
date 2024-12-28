import { AddRepositoryItemsRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler";
import { AbstractRequestHandlerContext } from "./app-event-request-handler";

export class AddRepositoryItemsRequestHandler implements AbstractRequestHandler<AddRepositoryItemsRequest> {
  async handle({ app, event }: AbstractRequestHandlerContext<AddRepositoryItemsRequest>): Promise<void> {
    event.nodeUris.forEach((nodeUri) => {
      const nodeItem = {
        uri: nodeUri,
        name: nodeUri.split(".")[1],
        description: "",
        category: "default",
      };
      app.state.repository[nodeUri] = nodeItem;
    });
  }
}
