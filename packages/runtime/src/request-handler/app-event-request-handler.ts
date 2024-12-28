import { AbstractRequest } from "@d3s/event";
import { Runtime } from "../domain/runtime/runtime";

export interface AbstractRequestHandlerContext<T extends AbstractRequest> {
  app: Runtime;
  event: T;
}