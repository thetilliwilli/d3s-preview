import { DataState } from "./data-state";
import { NetworkState } from "./network-state";

export class AppStateWithData {
  public state = new NetworkState();
  public data: DataState = [];
  // public "package.json": {
  //   name: string;
  //   dependencies: { [lib: string]: string };
  // };
}
