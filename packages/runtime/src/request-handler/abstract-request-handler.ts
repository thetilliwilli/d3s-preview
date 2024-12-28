import { AbstractRequest } from "@d3s/event";
import { AbstractRequestHandlerContext } from "./app-event-request-handler";

export interface AbstractRequestHandler<T extends AbstractRequest, TResult=void> {
  handle({ app, event }: AbstractRequestHandlerContext<T>): Promise<TResult>;
}
