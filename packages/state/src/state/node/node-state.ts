import { Dictionary } from "@d3s/utils";
import { NodeMetaState } from "../node-meta-state";
import { PositionState } from "../position-state";
import { DataKey } from "../data-key";

export class NodeState {
  constructor(
    public meta: NodeMetaState,
    public state: Dictionary<DataKey>,
    public input: Dictionary<DataKey>,
    public output: Dictionary<DataKey>,
    public active: boolean
  ) {}
}

export function getEmptyNodeState(): NodeState {
  return new NodeState({ guid: "", nodeUri: "", name: "", position: new PositionState(0, 0) }, {}, {}, {}, true);
}
