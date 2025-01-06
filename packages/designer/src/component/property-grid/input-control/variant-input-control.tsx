import { DataKey } from "@d3s/state";
import { forwardRef } from "react";
import { BindType, ControlSignal, ControlSignalWithTypeAndNode } from "../control";
import { ControlButtonPanel } from "./control-button-panel";
import { InputLabel } from "./input-label";
import { toInputElement } from "./to-input-attributes";
import { TypeTag } from "./type-tag";

const inputControlStyles: React.CSSProperties = { marginBottom: "4px", transition: "background-color 0.2s ease" };

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
    const inputElement = toInputElement(props.type, props.value, props.name, props.readonly, props.onChange, ref);

    const buttonProps = {
      name: props.name,
      type: props.type,
      value: props.value,
      readonly: props.readonly,
      bindType: props.bindType,
      nodeGuid: props.nodeGuid,
      onInvoke: props.onInvoke,
      onCustomView: props.onCustomView,
    };

    return (
      <div style={inputControlStyles}>
        <InputLabel name={props.name} type={props.type} dataKey={props.dataKey} nodeGuid={props.nodeGuid} />
        {inputElement}
        <ControlButtonPanel {...buttonProps} />
      </div>
    );
  }
);
