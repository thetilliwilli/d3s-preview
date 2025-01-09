import { NodeBuilder } from "../node/node-builder.js";
import { IDataService } from "./i-data-service.js";

export interface RuntimeSettings {
  resolveNode: (nodeUri: string) => Promise<NodeBuilder>;
  logToHost: (log: any) => void;
  dataService: IDataService;
  promptAi: (prompt: string) => Promise<string>;
}
