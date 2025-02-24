import { DataKey, NodeState } from "@d3s/state";
import { DataCache } from "../../service/data-cache";

const communication = new BroadcastChannel("customView");

export function createCustomView(render: string, nodeState: NodeState, dataCache: DataCache) {
  const node = getNodeContent(nodeState, dataCache);
  const childWindow = window.open();

  if (!childWindow) return;

  (childWindow as any).$view = {
    node: node,
    emit(name: string, data: any) {
      const signal = { nodeGuid: this.node.meta.guid, type: "input", name, data };
      communication.postMessage(signal);
    },
  };

  childWindow.document.write(render);
}

export function getNodeContent(nodeState: NodeState, dataCache: DataCache) {
  return {
    meta: nodeState.meta,
    state: toContent(nodeState.state, dataCache),
    input: toContent(nodeState.input, dataCache),
    output: toContent(nodeState.output, dataCache),
  };
}

function toContent(obj: { [name: string]: DataKey }, dataCache: DataCache) {
  return Object.fromEntries(Object.entries(obj).map(([name, dataKey]) => [name, dataCache.get(dataKey)]));
}
