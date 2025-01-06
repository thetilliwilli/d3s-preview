import { SendSignalRequest } from "@d3s/event";
import { DataKey } from "@d3s/state";
import { socketClient } from "../../../service/socket-client-service";

const labelStyles: React.CSSProperties = {
  display: "inline-block",
  width: "45%",
  textAlign: "right",
};

const typeLabelStyles: React.CSSProperties = { color: "grey", fontSize: ".7em" };

export const InputLabel = ({
  name,
  type,
  dataKey,
  nodeGuid,
}: {
  type: string;
  name: string;
  dataKey: DataKey;
  nodeGuid: string;
}) => {
  const typeLabel = `(${type.slice(0, 3)})`;
  return (
    <label style={labelStyles}>
      <button
        onClick={() => {
          const dataString = prompt(name);
          if (name !== null && dataString !== null) {
            const data = JSON.parse(dataString);
            socketClient.send(new SendSignalRequest(nodeGuid, name, data));
          }
        }}
      >
        {name}
      </button>
      <span style={typeLabelStyles}>{`#${dataKey}${typeLabel}`}</span>
    </label>
  );
};
