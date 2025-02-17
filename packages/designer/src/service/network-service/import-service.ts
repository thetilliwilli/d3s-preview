import { AbstractRequest, AddNodeRequest } from "@d3s/event";
import { dataTransferTypes } from "../../domain/consts";

export class ImportService {
  public static parse(resource: unknown): AbstractRequest | null {
    if (resource instanceof DataTransfer) {
      for (const item of Array.from(resource.items)) {
        if (item.kind === "string" && item.type === dataTransferTypes.node) {
          const data = resource.getData(dataTransferTypes.node);
          if (data !== undefined && data !== "") {
            const node = JSON.parse(data);
            const req = new AddNodeRequest(node.uri);
            Object.assign(req, node);
            return req;
          }
        }
      }
    }

    return null;
  }
}
