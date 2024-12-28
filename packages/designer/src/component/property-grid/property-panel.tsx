import { Control } from "./control";
import { InputControl } from "./input-control/input-control";

const panelStyles: React.CSSProperties = {
  border: "1px solid grey",
  marginBottom: "2px",
  width: "98%",
  marginLeft: "auto",
  marginRight: "auto",
};

const titleStyles: React.CSSProperties = { color: "grey", paddingLeft: "8px" };

export const PropertyPanel = ({
  controls,
  type,
  addProperty,
}: {
  controls: Control[];
  type: "input" | "state" | "output";
  addProperty: () => void;
}) => (
  <div style={panelStyles}>
    <div style={titleStyles}>{type[0].toUpperCase() + type.slice(1)}</div>
    <button onClick={addProperty}>+</button>
    <form
      className={type}
      onSubmit={(event) => {
        // предотвращает переход на новую страницу при нажатие enter внутри инпута
        event.preventDefault();
        return false;
      }}
    >
      {controls.map((x) => (
        <InputControl key={x.name} control={x} />
      ))}
    </form>
  </div>
);
