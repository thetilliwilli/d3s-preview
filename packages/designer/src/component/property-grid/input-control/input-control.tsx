import { useEffect, useRef, useState } from "react";
import { dataCache } from "../../../service/data-cache";
import { Control } from "../control";
import { InputLabel } from "./input-label";
import { VariantInputControl } from "./variant-input-control";
import { Serializor } from "./serializer";
import { TypeTag } from "./type-tag";

const inputControlStyles: React.CSSProperties = { marginBottom: "4px", transition: "background-color 0.2s ease" };

function schemaToInputType(value: unknown): TypeTag {
  const type = typeof value;
  switch (type) {
    case "boolean":
    case "number":
    case "string":
      return type;
    default:
      return "object";
  }
}

export const InputControl = ({ control }: { control: Control }) => {
  const [value, setValue] = useState(undefined);
  const type = schemaToInputType(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const listener = (value: any) => {
      setValue(value);
      if (inputRef.current && window.document.activeElement !== inputRef.current) {
        (inputRef.current as any)[inputRef.current.type === "checkbox" ? "checked" : "value"] = new Serializor(
          schemaToInputType(value)
        ).serialize(value);
      }
    };
    dataCache.on(control.dataKey, listener);
    return () => {
      dataCache.off(control.dataKey, listener);
    };
  }, [control.dataKey]);

  if (value === undefined)
    return (
      <div style={inputControlStyles}>
        <InputLabel name={control.name} type="raw" dataKey={control.dataKey} />
        <input value={"dataKey#" + control.dataKey} type="text" disabled />
      </div>
    );

  return <VariantInputControl {...control} type={type} value={value} ref={inputRef} />;
};
