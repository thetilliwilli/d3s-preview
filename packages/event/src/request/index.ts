import { NetworkState, NodeMetaState, PositionState } from "@d3s/state";
import { AbstractRequest } from "./abstract-request";
import { Dictionary } from "@d3s/utils";

export class AddBindingRequest extends AbstractRequest {
  public type = "AddBindingRequest" as const;
  constructor(public fromNode: string, public fromProperty: string, public toNode: string, public toProperty: string) {
    super();
  }
}

export class AddEntityRequest extends AbstractRequest {
  public type = "AddEntityRequest" as const;
  constructor(public entityData: string) {
    super();
  }
}

export class AddNodeRequest extends AbstractRequest {
  public type = "AddNodeRequest" as const;
  public guid: string | null = null; //MEGA HACK
  public position: PositionState = new PositionState(0, 0);
  public name: string = "";
  // HACK
  public state: Dictionary<any> = {};
  public input: Dictionary<any> = {};
  public output: Dictionary<any> = {};
  constructor(public nodeUri: string) {
    super();
  }
}

export class InvokeNodeRequest extends AbstractRequest {
  public type = "InvokeNodeRequest" as const;
  public input: Dictionary<any> = {};
  constructor(public nodeUri: string, public invoke: string, public output: string) {
    super();
  }
}

export class AddAiNodeRequest extends AbstractRequest {
  public type = "AddAiNodeRequest" as const;
  constructor(public prompt: string) {
    super();
  }
}

export class AddRepositoryItemsRequest extends AbstractRequest {
  public type = "AddRepositoryItemsRequest" as const;
  constructor(public nodeUris: string[]) {
    super();
  }
}

export class BootstrapRequest extends AbstractRequest {
  public type = "BootstrapRequest" as const;
}

export class DeleteAllNodesRequest extends AbstractRequest {
  public type = "DeleteAllNodesRequest" as const;
}

export class DeleteBindingRequest extends AbstractRequest {
  public type = "DeleteBindingRequest" as const;
  constructor(public bindingGuid: string) {
    super();
  }
}

export class DeleteNodeRequest extends AbstractRequest {
  public type = "DeleteNodeRequest" as const;
  constructor(public nodeGuid: string) {
    super();
  }
}

export class ActiveNodeRequest extends AbstractRequest {
  public type = "ActiveNodeRequest" as const;
  constructor(public nodeGuid: string, public active: boolean) {
    super();
  }
}

export class GetRepositoryItemsRequest extends AbstractRequest {
  public type = "GetRepositoryItemsRequest" as const;
}

export class LoadNetworkRequest extends AbstractRequest {
  public type = "LoadNetworkRequest" as const;
  /** hack: на самом деле тут должен быть NetworkState, но чтобы не ссылаться на @d3s/state - подумать потом и может отрефакторить */
  constructor(public networkState: NetworkState) {
    super();
  }
}

export class SendSignalRequest extends AbstractRequest {
  public type = "SendSignalRequest" as const;
  constructor(
    public nodeGuid: string,
    public name: string,
    public data: any,
    public signalType: "input" | "output" = "input"
  ) {
    super();
  }
}

export class UpdateMetaRequest extends AbstractRequest {
  public type = "UpdateMetaRequest" as const;
  constructor(public nodeGuid: string, public meta: Partial<NodeMetaState>) {
    super();
  }
}
