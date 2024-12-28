import { Dictionary } from "@d3s/utils";
import { BindingState } from "./binding/binding-state";
import { NodeState } from "./node/node-state";
import { RepositoryItem } from "./repository/repository-item";

/**
 * то что нужно отдать UI
 * и то что будет акксесситься различными клиентами по АПИ
 * */
export class NetworkState {
  public nodes: Dictionary<NodeState> = {};
  public bindings: Dictionary<BindingState> = {};
  public repository: Dictionary<RepositoryItem> = {};
}
