import { ControlSignal } from "../control";
import { TypeTag } from "./type-tag";
import { Serializor } from "./serializer";

const serializedValueSizeLimitBytes = 1 * 1000;
const titleTruncateLimit = 1000;

const styles: React.CSSProperties = {
  borderRadius: 0,
  borderWidth: "1px",
  width: "30%",
  margin:0,
  resize: "none",
  overflow: "hidden",
};

export function toInputElement(
  type: TypeTag,
  value: any,
  name: string,
  readonly: boolean,
  onChange: (signal: ControlSignal) => void,
  ref: React.ForwardedRef<any>
) {
  const serializer = new Serializor(type);

  const targetProperty = (() => {
    switch (type) {
      case "string":
        return "value";
      case "number":
        return "value";
      case "object":
        return "value";
      case "boolean":
        return "checked";
    }
  })();

  const serializedValue = serializer.serialize(value);
  const serializedValueAsString = serializedValue + "";
  const isSizeLimitOverflow = serializedValueAsString.length > serializedValueSizeLimitBytes;
  const serializedValueAsStringLimited = serializedValueAsString.slice(0, serializedValueSizeLimitBytes);

  const title =
    serializedValueAsString.length > titleTruncateLimit
      ? `-----full data size: ${Math.floor(
          serializedValueAsString.length / 1024
        )} KB-----\n${serializedValueAsString.slice(0, titleTruncateLimit)}...`
      : serializedValueAsString;

  const attributes = {
    style: styles,
    title: title,
    name: name,
    disabled: isSizeLimitOverflow ? true : readonly,
    onKeyDown: (event: any) => {
      event.stopPropagation();
    },
    onChange: (event: any) => onChange({ name: name, value: serializer.deserialize(event.target[targetProperty]) }),
    ref: ref,
  };

  switch (type) {
    case "string": {
      return <textarea {...attributes} defaultValue={serializedValueAsStringLimited} rows={1} />;
    }
    case "number":
      return <input {...attributes} defaultValue={serializedValue} type="number" />;
    case "object":
      return <input {...attributes} defaultValue={serializedValueAsStringLimited} type="text" />;
    case "boolean":
      return <input {...attributes} defaultChecked={serializedValue} type="checkbox" />;
  }
}
