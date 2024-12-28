import { DataState } from "./data-state";
import { NetworkState } from "./network-state";

export class AppStateWithData {
  public state = new NetworkState();
  public data: DataState = [];
}
