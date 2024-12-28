import { DataKey } from "@d3s/state";

const labelStyles: React.CSSProperties = {
  display: "inline-block",
  width: "45%",
  textAlign: "right",
};

const typeLabelStyles: React.CSSProperties = { color: "grey", fontSize: ".7em" };

export const InputLabel = ({ name, type, dataKey }: { type: string; name: string; dataKey: DataKey }) => {
  const typeLabel = `(${type.slice(0, 3)})`;
  return (
    <label style={labelStyles}>
      {name}
      <span style={typeLabelStyles}>{`#${dataKey}${typeLabel}`}</span>
    </label>
  );
};
