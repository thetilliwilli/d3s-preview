import { DeleteBindingRequest } from "@d3s/event";
import { useAppSelector } from "../../app/hooks";
import { socketClient } from "../../service/socket-client-service";
import { BindingControl } from "./binding-control";
import { store } from "../../app/store";
import { uiSlice } from "../../slice/ui-slice";

const styles: React.CSSProperties = {
  width: "40%",
  height: "40%",
  position: "fixed",
  top: "30%",
  bottom: "30%",
  left: "30%",
  right: "30%",
  zIndex: 99999,
  backgroundColor: "white",
  boxShadow: "0 0 8px #444444",
  overflow: "auto",
};

const titleStyles: React.CSSProperties = {
  fontSize: "1.5em",
  color: "grey",
  textAlign: "center",
  marginBottom: "10px",
};

export function BindingEditor() {
  const selectedBindings = useAppSelector(
    function getSelectedBindings(state) {
      return state.ui.selectedBindings.map((guid) => state.network.network.bindings[guid]);
    },
    (old, newValue) => old.map((x) => x.guid).join() === newValue.map((x) => x.guid).join()
  );

  const isSelected = selectedBindings.filter((x) => x !== undefined).length > 0;

  if (!isSelected) return;

  const runtimeStyles: React.CSSProperties = {
    ...styles,
    ...{ visibility: isSelected ? "visible" : "collapse" },
  };

  const controls = selectedBindings.map((x) => (
    <BindingControl
      key={x.guid}
      binding={x}
      onDelete={() => {
        store.dispatch(uiSlice.actions.clearBindingSelection());
        socketClient.send(new DeleteBindingRequest(x.guid));
      }}
    />
  ));

  const nodeGuid1 = selectedBindings[0].from.node.slice(0, 8);
  const nodeGuid2 = selectedBindings[0].to.node.slice(0, 8);

  return (
    <div style={runtimeStyles}>
      <span style={titleStyles}>BindingEditor</span>
      <table border={1} style={{ margin: "auto", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>node ({nodeGuid1})</th>
            <th></th>
            <th>node ({nodeGuid2})</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{controls}</tbody>
      </table>
    </div>
  );
}
