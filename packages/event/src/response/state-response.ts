import { NetworkState } from "@d3s/state";
import { AbstractResponse } from "./abstract-response";

export class StateResponse extends AbstractResponse {
  public type = "StateResponse" as const;
  constructor(public networkState: NetworkState) {
    super();
  }
}
