import { SendSignalRequest } from "@d3s/event";
import { viewPrefix } from "../../../domain/consts";
import { socketClient } from "../../../service/socket-client-service";
import { BindType, ControlSignal, ControlSignalWithTypeAndNode } from "../control";
import { Serializor } from "./serializer";
import { TypeTag } from "./type-tag";

const styles: React.CSSProperties = { marginLeft: "4px", /* borderRadius: 0, borderWidth: "1px", visibility: "initial" */ };

const PropertyControlButton = ({ onClick, onContextMenu, text, disabled, title, backgroundColor }: any) => {
  return (
    <button
      tabIndex={-1}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ ...styles, backgroundColor: backgroundColor || "" }}
      disabled={disabled}
      title={title}
    >
      {text}
    </button>
  );
};

export const ControlButtonPanel = (props: {
  name: string;
  type: TypeTag;
  value: any;
  readonly: boolean;
  bindType: BindType;
  nodeGuid: string;
  onInvoke: (signal: ControlSignal) => void;
  onCustomView: (signal: ControlSignalWithTypeAndNode) => void;
}) => {
  // const getEditText = (value: any, altKey: boolean = false) =>
  //   (value + "").startsWith(viewPrefix) ? (altKey ? "E" : "V") : altKey ? "V" : "E";

  // const getEditTitle = (value: any, altKey: boolean = false) =>
  //   (value + "").startsWith(viewPrefix)
  //     ? altKey
  //       ? "Edit (отдельное окно для редактирования кода)"
  //       : "View (customView)"
  //     : altKey
  //     ? "View (customView)"
  //     : "Edit (отдельное окно для редактирования кода)";

  return (
    <>
      <PropertyControlButton
        onClick={() => {
          props.onInvoke({ name: props.name, value: props.value });
        }}
        text={"\u25BA"}
        title="Signal (поссылка сигнала на сервер с текущим значением)"
        backgroundColor={props.value === null ? "#fd5e7c" : ""}
      />

      {/* <button
        tabIndex={-1}
        onClick={(e) => {
          const element: HTMLInputElement | null = window.document.querySelector(
            `.propertyEditor form [name='${props.name}']`
          );
          if (element) {
            const serializer = new Serializor(props.type);
            const serializedValue = serializer.serialize(props.value);
            props.onCustomView({
              name: props.name,
              // hack: workaround проблемы с рендерингом в HTMLInput'e больших данны (размером > 1 МБ) - UI и браузер виснут
              // предположение - если элемент отключён значит его значение не менялось
              // значит можно взять из пришедшего извне первоначального значения
              value: element.disabled ? serializedValue : element.value,
              type: props.type,
              nodeGuid: props.nodeGuid,
              altKey: e.altKey,
              bindType: props.bindType,
            });
          }
        }}
        onContextMenu={(event: React.MouseEvent) => {
          event.preventDefault();
          const element: HTMLInputElement | null = window.document.querySelector(
            `.propertyEditor form [name='${props.name}']`
          );
          element?.requestFullscreen();
        }}
        style={{ ...styles, backgroundColor: getEditText(props.value) === "V" ? "#03a9f4" : "" }}
        title={getEditTitle(props.value)}
        onMouseMove={(e) => {
          const target: any = e.target;
          target.textContent = getEditText(props.value, e.altKey);
          target.title = getEditTitle(props.value, e.altKey);
        }}
        onMouseLeave={(e) => {
          const target: any = e.target;
          target.textContent = getEditText(props.value);
          target.title = getEditTitle(props.value);
        }}
      >
        {getEditText(props.value)}
      </button> */}

      {/* <PropertyControlButton
        onClick={() => {
          navigator.clipboard.writeText(props.value);
        }}
        text="C"
        title="Copy to clipboard"
      /> */}
      {/* <PropertyControlButton
        onClick={() => {
          const dataString = prompt("Введите новое значение чтобы изменить тип данных:");
          if (dataString !== null) {
            const data = JSON.parse(dataString);
            socketClient.send(new SendSignalRequest(props.nodeGuid, props.name, data));
          }
        }}
        text="T"
        title="Change type"
      /> */}
      {/* <PropertyControlButton
        onClick={() => {
          console.log(props.value);
        }}
        text="L"
        title="Log to console"
      /> */}

      {/* <PropertyControlButton
        onClick={() => {
          const channel = `${window.location.href}channel/root/${props.nodeGuid}/${props.bindType}/${props.name}`;
          navigator.clipboard.writeText(channel);
          window.open(channel);
        }}
        text="W"
        title="Watch mode (отдельное окно с отображением изменений данного параметра)"
      /> */}
    </>
  );
};
