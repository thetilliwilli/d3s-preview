import { DataKey } from "@d3s/state";
import { forwardRef } from "react";
import { BindType, ControlSignal, ControlSignalWithTypeAndNode } from "../control";
import { InputLabel } from "./input-label";
import { Serializor } from "./serializer";
import { toInputElement } from "./to-input-attributes";
import { TypeTag } from "./type-tag";

export const VariantInputControl = forwardRef(
  (
    props: {
      name: string;
      type: TypeTag;
      value: any;
      dataKey: DataKey;
      readonly: boolean;
      bindType: BindType;
      nodeGuid: string;
      onChange: (signal: ControlSignal) => void;
      onInvoke: (signal: ControlSignal) => void;
      onCustomView: (signal: ControlSignalWithTypeAndNode) => void;
    },
    ref
  ) => {
    const inputElement = toInputElement(
      props.type,
      props.value,
      props.name,
      props.readonly,
      props.onChange,
      ref,
      (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        console.log(props.value);
      },
      (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const element = e.target as HTMLInputElement;
        if (element) {
          const serializer = new Serializor(props.type);
          const serializedValue = serializer.serialize(props.value);
          props.onCustomView({
            name: props.name,
            // hack: workaround проблемы с рендерингом в HTMLInput'e больших данны (размером > 1 МБ) - UI и браузер виснут
            // предположение - если элемент отключён значит его значение не менялось
            // значит можно взять из пришедшего извне первоначального значения
            value: element.readOnly ? serializedValue : element.value,
            type: props.type,
            nodeGuid: props.nodeGuid,
            altKey: e.altKey,
            bindType: props.bindType,
          });
        }
      },
      (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        //HACK - для воссоздания несуществующего типа TypeTag = "action"
        if (props.value === null) {
          props.onInvoke({ name: props.name, value: props.value });
        } else {
          if (e.ctrlKey) {
            props.onInvoke({ name: props.name, value: props.value });
          }
        }
      }
    );
    return (
      <div style={{ marginBottom: "4px", transition: "background-color 0.2s ease" }}>
        <InputLabel
          name={props.name}
          type={props.type}
          dataKey={props.dataKey}
          nodeGuid={props.nodeGuid}
          bindType={props.bindType}
          value={props.value}
        />
        &nbsp;
        {inputElement}
      </div>
    );
  }
);
