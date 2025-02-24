import { dataCache } from "./data-cache";
import { socketClient } from "./socket-client-service";

export class DeveloperTools {
  constructor(public paper: any, public graph: any) {}

  get dataCache() {
    return dataCache;
  }

  get socketClient() {
    return socketClient;
  }
}
