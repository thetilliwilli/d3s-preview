import { DataKey } from "@d3s/state";
import { TypeTag } from "./input-control/type-tag";

export interface ControlSignal {
  name: string;
  value: any;
}

export type BindType = "input" | "output" | "none";

export interface ControlSignalWithTypeAndNode {
  name: string;
  value: any;
  type: TypeTag;
  nodeGuid: string;
  altKey: boolean;
  bindType: BindType;
}


export class Control {
  public name: string = "";
  public dataKey: DataKey = 0;
  public readonly: boolean = false;
  public bindType: BindType = "none";
  public nodeGuid: string = "";
  public onChange: (signal: ControlSignal) => void = () => {};
  public onInvoke: (signal: ControlSignal) => void = () => {};
  public onCustomView: (signalWithType: ControlSignalWithTypeAndNode) => void = () => {};
  constructor(state: Partial<Control>) {
    Object.assign(this, state);
  }
}
