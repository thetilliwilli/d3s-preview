import { AbstractResponse } from "./abstract-response";

export class InboundSignalResponse extends AbstractResponse {
  public type = "InboundSignalResponse" as const;

  constructor(public nodeGuid: string, public name: string, public data: string) {
    super();
  }
}
