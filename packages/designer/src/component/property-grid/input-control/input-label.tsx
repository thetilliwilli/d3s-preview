import { AddBindingRequest, SendSignalRequest } from "@d3s/event";
import { DataKey } from "@d3s/state";
import { useAppSelector } from "../../../app/hooks";
import { store } from "../../../app/store";
import { socketClient } from "../../../service/socket-client-service";
import { bindingSlice } from "../../../slice/binding-slice";
import { BindType } from "../control";
import { TypeTag } from "./type-tag";

// const typeLabelStyles: React.CSSProperties = { color: "grey", fontSize: ".7em" };
const boundColor = "limegreen";
const unboundColor = "rgb(240, 240, 240)";

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

  //HACK for TagType = "action"
  const typeLabel = value === null ? "act" : `${type.slice(0, 3)}`;

  return (
    <label
      style={{
        display: "inline-block",
        width: "45%",
        textAlign: "left",
      }}
    >
      <button
        style={{
          margin: "0px 2% 0px 2%",
          height: "12px",
          width: "12px",
          borderRadius: "0px",
          border: "1px solid lightgrey",
          backgroundColor: isBound ? boundColor : unboundColor,
          visibility:
            bindingStart && (bindType !== "output" || type != bindingStart.type || nodeGuid === bindingStart.nodeGuid)
              ? "hidden"
              : "initial",
        }}
        title={bindingStart ? "Связать с этим параметром" : "Нажмите чтобы начать привязку этого параметра к другому"}
        onPointerEnter={(e) => {
          e.currentTarget.style.backgroundColor = boundColor;
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.backgroundColor = isBound ? boundColor : unboundColor;
        }}
        onClick={() => {
          if (bindingStart) {
            const request = new AddBindingRequest(nodeGuid, name, bindingStart.nodeGuid, bindingStart.name);
            socketClient.send(request);
            store.dispatch(bindingSlice.actions.endBinding());
          } else {
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
          }
        }}
      ></button>
      {name}
      <span
        style={{ float: "right", color: "grey" }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const dataString = prompt("Введите новое значение, чтобы изменить тип данных:");
          if (dataString !== null) {
            const data = JSON.parse(dataString);
            socketClient.send(new SendSignalRequest(nodeGuid, name, data));
          }
        }}
        title="Сменить тип данных"
        onPointerEnter={(e) => {
          e.currentTarget.style.color = "#03a9f4";
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.color = "grey";
        }}
      >
        <span style={{ margin: "auto", fontSize: ".65em" }}>{`{${typeLabel}#${dataKey}}`}</span>
      </span>
    </label>
  );
};
