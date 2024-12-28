import { AbstractResponse } from "./abstract-response";

export class OutboundSignalResponse extends AbstractResponse {
  public type = "OutboundSignalResponse" as const;
}
