import { AddBindingRequest } from "@d3s/event";
import { DataKey } from "@d3s/state";
import { useAppSelector } from "../../../app/hooks";
import { store } from "../../../app/store";
import { socketClient } from "../../../service/socket-client-service";
import { bindingSlice } from "../../../slice/binding-slice";
import { BindType } from "../control";
import { TypeTag } from "./type-tag";

const labelStyles: React.CSSProperties = {
  display: "inline-block",
  width: "45%",
  textAlign: "left",
  // marginLeft: "2%",
};

const typeLabelStyles: React.CSSProperties = { color: "grey", fontSize: ".7em" };

export const InputLabel = ({
  name,
  type,
  dataKey,
  nodeGuid,
  bindType,
  value,
}: {
  type: TypeTag;
  name: string;
  dataKey: DataKey;
  nodeGuid: string;
  bindType: BindType;
  value: any;
}) => {
  const bindingStart = useAppSelector((state) => state.binding.bindingStart);
  const bindings = useAppSelector((state) => state.network.network.bindings);
  const connectedBindings = Object.entries(bindings)
    .filter(([_, binding]) =>
      bindType === "input"
        ? binding.to.node === nodeGuid && binding.to.property === name
        : binding.from.node === nodeGuid && binding.from.property === name
    )
    .map((x) => x[1]);
  const isBound = connectedBindings.length > 0;

  const typeLabel = `${type.slice(0, 3)}`;

  const labelButtonStyles: React.CSSProperties = {
    margin: "0px 2% 0px 2%",
    height: "12px",
    width: "12px",
    borderRadius: "0px",
    border: "1px solid lightgrey" /* padding: "0px 12px 0px 12px" */,
    backgroundColor: isBound ? "limegreen" : "rgb(240, 240, 240)",
  };

  const labelButton = bindingStart ? (
    (() => {
      const disabled = bindType !== "output" || type != bindingStart.type || nodeGuid === bindingStart.nodeGuid;
      return (
        <button
          style={{
            ...labelButtonStyles,
            visibility: disabled ? "hidden" : "initial",
          }}
          title={
            bindType === "output" && type != bindingStart.type
              ? `Не может быть связан так как тип не совпадает: ${bindingStart.type} != ${type}`
              : "Связать с этим параметром"
          }
          onClick={() => {
            const request = new AddBindingRequest(nodeGuid, name, bindingStart.nodeGuid, bindingStart.name);
            socketClient.send(request);
            store.dispatch(bindingSlice.actions.endBinding());
          }}
          onPointerEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.backgroundColor = "black";
            e.currentTarget.style.color = "rgb(240, 240, 240)";
          }}
          onPointerLeave={(e) => {
            if (disabled) return;
            e.currentTarget.style.backgroundColor = "rgb(240, 240, 240)";
            e.currentTarget.style.color = "black";
          }}
          disabled={disabled}
        ></button>
      );
    })()
  ) : (
    <button
      style={labelButtonStyles}
      title="Нажмите чтобы начать привязку этого параметра к другому"
      onPointerEnter={(e) => {
        e.currentTarget.style.backgroundColor = "black";
        e.currentTarget.style.color = "rgb(240, 240, 240)";
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgb(240, 240, 240)";
        e.currentTarget.style.color = "black";
      }}
      onClick={() => {
        if (bindType === "input") {
          store.dispatch(
            bindingSlice.actions.startBinding({
              name: name,
              type: type,
              nodeGuid: nodeGuid,
              value: value,
            })
          );
        }
      }}
    ></button>
  );

  return (
    <label style={labelStyles}>
      {labelButton}
      {name}
      <span style={typeLabelStyles}>{`${typeLabel} #${dataKey} `}</span>
    </label>
  );
};
