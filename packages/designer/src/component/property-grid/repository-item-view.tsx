import { AddNodeRequest } from "@d3s/event";
import { dataTransferTypes } from "../../domain/consts";

const styles: React.CSSProperties = {
  cursor: "grab",
  display: "inline-block",
  height: "104px", // должен соответвовать размеру нода в jointjs
};

export const RepositoryItemView = (props: { addNodeRequest: AddNodeRequest; description: string }) => {
  return (
    <div
      title={`${props.addNodeRequest.nodeUri}\t${props.description}`}
      style={styles}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(dataTransferTypes.node, JSON.stringify(props.addNodeRequest));
      }}
    >
      <svg width={204} height={104} style={{ backgroundColor: "#0000" }}>
        <g transform="translate(2,2)">
          <rect strokeWidth="2" stroke="grey" fill="white" width="200" height="100"></rect>
          <text fontSize="1.4em" xmlSpace="preserve" textAnchor="start" x="4" y="4" fill="lightgrey">
            <tspan dy="0.8em">{props.addNodeRequest.nodeUri.split(".")[1]}</tspan>
          </text>
          <text fontSize="12" xmlSpace="preserve" textAnchor="middle" fill="black" x="100" y="50">
            <tspan dy="0.3em">{props.addNodeRequest.name}</tspan>
          </text>
        </g>
      </svg>
    </div>
  );
};
