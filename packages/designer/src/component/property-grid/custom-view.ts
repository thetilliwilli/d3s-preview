import { DataKey, NodeState } from "@d3s/state";
import { DataCache } from "../../service/data-cache";
import { viewPrefix } from "../../domain/consts";

export function createCustomView(render: string, nodeState: NodeState, dataCache: DataCache) {
  let view = render.split(viewPrefix)[1].split("*/")[0].trim();
  if (view === "") view = "custom.html";
  const w = window.open(view);
  const node = getNodeContent(nodeState, dataCache);
  const startMessage = { messageType: "render", node, render };
  w?.addEventListener("load", () => {
    w?.postMessage(startMessage);
  });
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
