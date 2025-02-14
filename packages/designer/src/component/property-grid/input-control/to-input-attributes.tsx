import { ControlSignal } from "../control";
import { TypeTag } from "./type-tag";
import { Serializor } from "./serializer";
import { viewPrefix } from "../../../domain/consts";

const serializedValueSizeLimitBytes = 1 * 1000;
const titleTruncateLimit = 1000;
const viewColor = "rgb(3, 169, 244)";
// const viewColorReadonly = "rgb(0, 101, 148)";

const styles: React.CSSProperties = {
  borderRadius: 0,
  borderWidth: "1px",
  width: "30%",
  margin: 0,
  resize: "none",
  overflow: "hidden",
};

export function toInputElement(
  type: TypeTag,
  value: any,
  name: string,
  readonly: boolean,
  onChange: (signal: ControlSignal) => void,
  ref: React.ForwardedRef<any>,
  rightClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void,
  doubleClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
  // click: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
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

  const isView = (value + "").trim().startsWith(viewPrefix);
  const readOnly = isSizeLimitOverflow ? true : readonly;
  const backgroundColor = readOnly ? (isView ? viewColor : "rgb(240,240,240)") : isView ? viewColor : "initial";

  const attributes = {
    style: { ...styles, backgroundColor: backgroundColor },
    title: title,
    name: name,
    readOnly: readOnly,
    onKeyDown: (event: any) => {
      event.stopPropagation();
    },
    onChange: (event: any) => onChange({ name: name, value: serializer.deserialize(event.target[targetProperty]) }),
    ref: ref,
    onContextMenu: rightClick,
    onDoubleClick: doubleClick,
    // onClick: click,
  };

  switch (type) {
    case "string":
      return <textarea {...attributes} defaultValue={serializedValueAsStringLimited} rows={1} />;
    case "number":
      return <input {...attributes} defaultValue={serializedValue} type="number" />;
    case "object":
      return <input {...attributes} defaultValue={serializedValueAsStringLimited} type="text" />;
    case "boolean":
      return <input {...attributes} defaultChecked={serializedValue} type="checkbox" />;
  }
}
