import { Control } from "./control";
import { InputControl } from "./input-control/input-control";

export const PropertyPanel = ({
  controls,
  type,
  addProperty,
}: {
  controls: Control[];
  type: "input" | "state" | "output";
  addProperty: () => void;
}) => (
  <div
    style={{
      border: "1px solid grey",
      marginBottom: "2px",
      width: "98%",
      marginLeft: "auto",
      marginRight: "auto",
    }}
  >
    <div style={{ color: "grey", paddingLeft: "8px" }}>
      {type.toUpperCase()}

      <button
        onClick={addProperty}
        style={{
          marginLeft: "5%",
          borderRadius: 0,
          border: "1px solid lightgrey",
          padding: "0px 18px 0px 18px",
          fontSize: "x-small",
          verticalAlign: "middle",
          color: "black",
        }}
      >
        new
      </button>
    </div>

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
