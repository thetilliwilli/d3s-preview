import { BindingState } from "@d3s/state";

export interface BindingControlProps {
  binding: BindingState;
  onDelete: () => void;
}

const invokeStyles: React.CSSProperties = {
  backgroundColor: "lightcoral",
  border: "1px solid black",
};

export function BindingControl(props: BindingControlProps) {
  return (
    <tr>
      <td>{props.binding.from.property}</td>
      <td>{"\u27A1"}</td>
      <td>{props.binding.to.property}</td>
      <td>
        <button
          style={invokeStyles}
          onClick={() => {
            props.onDelete();
          }}
        >
          &times;
        </button>
      </td>
    </tr>
  );
}
