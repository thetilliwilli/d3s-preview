import { dia, shapes } from "@joint/core";
import { store } from "../../app/store";
import { bindingService } from "../binding-service";
import { NodeElement } from "./node-element";

const strokeColor = "grey";
const nameChunkSize = 22;
function chunkString(str: string, n: number) {
  const substrings = [];
  for (let i = 0; i < str.length; i += n) {
    substrings.push(str.slice(i, i + n));
  }
  return substrings;
}

function tokenizeString(str: string, n: number){
  return str.split("\n").map(s=>chunkString(s,n)).flat().join("\n");
}

export function redrawNetwork(graph: dia.Graph) {
  const network = store.getState().network.network;
  const selectedNodeGuid = store.getState().network.selectedNodes[0];

  graph.clear();

  Object.entries(network.nodes).forEach(([nodeGuid, node]) => {
    const rect = new NodeElement({
      id: nodeGuid,
      node,
    });

    rect.position(node.meta.position.x, node.meta.position.y);

    rect.resize(200, 100);

    const typeText = node.meta.nodeUri.split(".")[1];
    const typeFontSize = typeText.length * 20 < 200 ? "20" : `calc(1.4*w/${typeText.length})`;
    const chunkedNodeName = tokenizeString(node.meta.name, nameChunkSize);
    const nameText = node.active ? chunkedNodeName : `(deactivated)\n${chunkedNodeName}`;
    rect.attr({
      body: {
        stroke: strokeColor,
        fill: nodeGuid === selectedNodeGuid ? "dodgerblue" : undefined,
      },
      type: {
        text: typeText,
        fontSize: typeFontSize,
      },
      name: {
        text: nameText,
        textDecoration: node.active ? undefined : "line-through",
        fill: node.active ? undefined : "grey",
      },
    });
    rect.addTo(graph);
  });

  const bindings = Object.values(network.bindings);
  const groups = bindingService.groupByFromNode(bindings);

  Object.values(groups).forEach((group) => {
    const firstBinding = group[0];
    const labelText = group.map((x) => `${x.from.property}\u27A1${x.to.property}`).join("\n");
    const linkLabels = [
      {
        attrs: {
          text: {
            text: labelText,
            fontSize: "0.75em",
            fill: "grey",
            textAnchor: "end",
          },
        },
        position: {
          distance: 0.95,
          offset: -14,
        },
      },
    ];

    const link = new shapes.standard.Link({
      attrs: {
        line: {
          stroke: strokeColor,
        },
      },
      bindings: group,
    });

    link.source({ id: firstBinding.from.node });
    link.target({ id: firstBinding.to.node });
    link.labels(linkLabels);
    link.addTo(graph);
  });
}
