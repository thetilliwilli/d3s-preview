import { NodeBuilder } from "../node/node-builder";
import { IDataService } from "./i-data-service";

export interface RuntimeSettings {
  resolveNode: (nodeUri: string) => Promise<NodeBuilder>;
  logToHost: (log: any) => void;
  dataService: IDataService;
}
