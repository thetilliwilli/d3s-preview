import { DeleteAllNodesRequest, eventNames, SendSignalRequest } from "@d3s/event";
import { NodeState } from "@d3s/state";
import { debounce } from "@d3s/utils";
import { useEffect, useRef } from "react";
import WinBox from "react-winbox";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { viewPrefix } from "../../domain/consts";
import { dataCache } from "../../service/data-cache";
import { socketClient } from "../../service/socket-client-service";
import { uiSlice } from "../../slice/ui-slice";
import { Control, ControlSignalWithTypeAndNode } from "./control";
import { createCustomView, getNodeContent } from "./custom-view";
import { Serializor } from "./input-control/serializer";
import { PropertyPanel } from "./property-panel";

const titleStyles: React.CSSProperties = {
  textAlign: "center",
};

const styles: React.CSSProperties = {
  width: "100%",
  overflow: "auto",
};

function PropertyEditorButtonPanel({ nodeState }: { nodeState: NodeState }) {
  const actions = {
    guid() {
      navigator.clipboard.writeText(nodeState.meta.guid);
    },
    log() {
      console.log(nodeState);
    },
    copy() {
      const nodeContent = getNodeContent(nodeState, dataCache);
      navigator.clipboard.writeText(JSON.stringify(nodeContent));
    },
    copyUri() {
      navigator.clipboard.writeText(nodeState.meta.nodeUri);
    },
    removeAll() {
      const confirmed = confirm("This will delete all the nodes. Are you sure?");
      if (confirmed) socketClient.send(new DeleteAllNodesRequest());
    },
  };
  const buttons = Object.values(actions).map((action, i) => (
    <button key={i} style={{ marginLeft: "25px", borderRadius: 0, borderWidth: "1px" }} onClick={action}>
      {action.name}
    </button>
  ));

  return <div style={{ marginTop: "8px", marginBottom: "8px" }}>{buttons}</div>;
}

const editViewCommunication = new BroadcastChannel("editView");
editViewCommunication.onmessage = (event) => {
  const messageData = event.data as ControlSignalWithTypeAndNode;
  if (messageData.bindType === "input") {
    const deserializedValue = new Serializor(messageData.type).deserialize(messageData.value);
    const signal = new SendSignalRequest(messageData.nodeGuid, messageData.name, deserializedValue);
    socketClient.send(signal);
  }
};

const customViewCommunication = new BroadcastChannel("customView");
customViewCommunication.onmessage = (event) => {
  const messageData = event.data as { nodeGuid: string; type: "input"; name: string; data: any };
  const signal = new SendSignalRequest(messageData.nodeGuid, messageData.name, messageData.data);
  socketClient.send(signal);
};

export const PropertyEditor = () => {
  const dispatch = useAppDispatch();

  const selectedNodeOrUndefined = useAppSelector((state) =>
    state.network.selectedNodes.length > 0 ? state.network.network.nodes[state.network.selectedNodes[0]] : undefined
  );

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function flashColor(type: "input" | "output", inputName: any) {
      const form = ref.current?.querySelector(`form.${type}`) as HTMLFormElement;
      const inputElement = form.elements.namedItem(inputName) as HTMLInputElement;
      const parentDiv = inputElement.parentElement as HTMLDivElement;
      parentDiv.style.backgroundColor = "crimson";
      window.setTimeout(() => {
        parentDiv.style.backgroundColor = "initial";
      }, 200);
    }

    const inboundSignalListener = (signal: { name: string; data: any; nodeGuid: string }) => {
      if (selectedNodeOrUndefined && signal.nodeGuid === selectedNodeOrUndefined.meta.guid)
        flashColor("input", signal.name);
    };

    const outboundSignalListener = (signal: any) => {
      if (selectedNodeOrUndefined && signal.nodeGuid === selectedNode.meta.guid) flashColor("output", signal.name);
    };

    socketClient.on(eventNames.inboundSignal, inboundSignalListener);
    socketClient.on(eventNames.outboundSignal, outboundSignalListener);

    return () => {
      socketClient.off(eventNames.inboundSignal, inboundSignalListener);
      socketClient.off(eventNames.outboundSignal, outboundSignalListener);
    };
  });

  if (selectedNodeOrUndefined === undefined) return <></>;

  const selectedNode = selectedNodeOrUndefined;

  const nodeGuid = selectedNode.meta.guid;

  const title = `${selectedNode.meta.name}\n\n${nodeGuid.slice(0, 8)}`;

  const onCustomView = (signal: ControlSignalWithTypeAndNode) => {
    const isCustomView = signal.value.trimStart().startsWith(viewPrefix);
    // its boolean xor :) aka [+true ^ +false]
    if (+isCustomView ^ +signal.altKey) createCustomView(signal.value, selectedNode, dataCache);
    else {
      // was
      // createEditView({ ...signal, nodeName: selectedNode.meta.name });

      //now
      dispatch(uiSlice.actions.createEditViewWindow({ ...signal, nodeName: selectedNode.meta.name }));
    }
  };

  const inputControls = Object.entries(selectedNode.input).map(
    ([name, dataKey]) =>
      new Control({
        name,
        dataKey,
        bindType: "input",
        nodeGuid,
        onChange: debounce((signal) => {
          socketClient.send(new SendSignalRequest(nodeGuid, signal.name, signal.value));
        }),
        onInvoke: (signal) => {
          socketClient.send(new SendSignalRequest(nodeGuid, signal.name, signal.value));
        },
        onCustomView,
      })
  );

  const stateControls = Object.entries(selectedNode.state).map(
    ([name, dataKey]) =>
      new Control({
        name,
        dataKey,
        bindType: "none",
        readonly: true,
      })
  );

  const outputControls = Object.entries(selectedNode.output).map(
    ([name, dataKey]) =>
      new Control({
        name,
        dataKey,
        bindType: "output",
        nodeGuid,
        readonly: true,
        onCustomView,
      })
  );

  return (
    <WinBox width={650} right={0} x="right" height="100%" background="grey" title="PropertyEditor" noClose={true}>
      <div ref={ref} className="propertyEditor" style={styles}>
        <div style={titleStyles}>{title}</div>
        <PropertyEditorButtonPanel nodeState={selectedNode} />
        <div
          style={{
            height: "80vh",
            overflow: "auto",
          }}
        >
          <PropertyPanel
            controls={inputControls}
            type="input"
            addProperty={() => {
              const name = prompt("name");
              const dataString = prompt("data");
              if (name !== null && dataString !== null) {
                const data = JSON.parse(dataString);
                socketClient.send(new SendSignalRequest(nodeGuid, name, data));
              }
            }}
          />
          <PropertyPanel controls={stateControls} type="state" addProperty={() => {}} />
          <PropertyPanel
            controls={outputControls}
            type="output"
            addProperty={() => {
              const name = prompt("name");
              const dataString = prompt("data");
              if (name !== null && dataString !== null) {
                const data = JSON.parse(dataString);
                socketClient.send(new SendSignalRequest(nodeGuid, name, data, "output"));
              }
            }}
          />
        </div>
      </div>
    </WinBox>
  );
};
