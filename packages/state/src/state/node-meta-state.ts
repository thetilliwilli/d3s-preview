import { PositionState } from "./position-state";

export interface NodeMetaState {
  guid: string;
  nodeUri: string;
  position: PositionState;
  name: string;
}
