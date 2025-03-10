import { AddRepositoryItemsRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class AddRepositoryItemsRequestHandler implements AbstractRequestHandler<AddRepositoryItemsRequest> {
  async handle({ app, event }: AbstractRequestHandlerContext<AddRepositoryItemsRequest>): Promise<void> {
    event.nodeUris.forEach((nodeUri) => {
      const nodeItem = {
        uri: nodeUri,
        name: nodeUri.split(".")[1],
        description: "",
        category: "default",
      };
      app.networkState.repository[nodeUri] = nodeItem;
    });
  }
}
