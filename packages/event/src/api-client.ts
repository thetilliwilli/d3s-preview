import { AbstractRequest } from "./request/abstract-request";
import { ResponseTypes } from "./response/response";

export interface ApiClient {
  connect(): Promise<void>;
  send(request: AbstractRequest): void;
  handle<TResponseMap extends ResponseTypes, TResponse extends keyof TResponseMap>(
    response: TResponse,
    handler: (response: TResponseMap[TResponse]) => void
  ): void;
}
