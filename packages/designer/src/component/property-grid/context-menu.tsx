import { DeleteAllNodesRequest } from "@d3s/event";
import { socketClient } from "../../service/socket-client-service";
import { getNodeContent } from "./custom-view";
import { dataCache } from "../../service/data-cache";
import { NodeState } from "@d3s/state";

export function ContextMenu({ node, onItemSelected }: { node: NodeState; onItemSelected: () => void }) {
  const actions = {
    guid() {
      onItemSelected();
      navigator.clipboard.writeText(node.meta.guid);
    },
    log() {
      onItemSelected();
      console.log(node);
    },
    copy() {
      onItemSelected();
      const nodeContent = getNodeContent(node, dataCache);
      navigator.clipboard.writeText(JSON.stringify(nodeContent));
    },
    copyUri() {
      onItemSelected();
      navigator.clipboard.writeText(node.meta.nodeUri);
    },
    removeAll() {
      onItemSelected();
      const confirmed = confirm("This will delete all the nodes. Are you sure?");
      if (confirmed) socketClient.send(new DeleteAllNodesRequest());
    },
  };
  const buttons = Object.values(actions).map((action, i) => (
    <button key={i} onClick={action}>
      {action.name}
    </button>
  ));

  return <div style={{ display: "flex", flexDirection: "column" }}>{buttons}</div>;
}
