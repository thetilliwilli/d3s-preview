import { NodeGuid } from "../node/node-guid";
import { BindingGuid } from "./binding-guid";

export class BindingState {
  public readonly from: { node: string; property: string };
  public readonly to: { node: string; property: string };

  constructor(
    public readonly guid: BindingGuid,
    fromNode: NodeGuid,
    fromProperty: string,
    toNode: NodeGuid,
    toProperty: string
  ) {
    this.from = { node: fromNode, property: fromProperty };
    this.to = { node: toNode, property: toProperty };
  }
}
