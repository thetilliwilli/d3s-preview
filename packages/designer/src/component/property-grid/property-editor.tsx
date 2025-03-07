import { eventNames, SendSignalRequest } from "@d3s/event";
import { NodeState } from "@d3s/state";
import { debounce } from "@d3s/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import WinBox from "react-winbox";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { dataCache } from "../../service/data-cache";
import { socketClient } from "../../service/socket-client-service";
import { uiSlice } from "../../slice/ui-slice";
import { ContextMenu } from "./context-menu";
import { Control, ControlSignalWithTypeAndNode } from "./control";
import { createCustomView } from "./custom-view";
import { InlineView } from "./inline-view";
import { Serializor } from "./input-control/serializer";
import { moreIconUrl } from "./more-icon-url";
import { PropertyPanel } from "./property-panel";
import { useViews } from "./use-views-hook";
import { ViewTabButton } from "./view-tab-button";

const styles: React.CSSProperties = {
  width: "100%",
  overflow: "auto",
};

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
  const selectedNodeOrUndefined = useAppSelector((state) =>
    state.network.selectedNodes.length > 0 ? state.network.network.nodes[state.network.selectedNodes[0]] : undefined
  );

  return selectedNodeOrUndefined === undefined ? null : <PropertyEditorInner node={selectedNodeOrUndefined} />;
};
export const PropertyEditorInner = (props: { node: NodeState }) => {
  const { node } = props;
  const nodeGuid = node.meta.guid;

  const dispatch = useAppDispatch();
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
      if (signal.nodeGuid === node.meta.guid) flashColor("input", signal.name);
    };

    const outboundSignalListener = (signal: any) => {
      if (signal.nodeGuid === node.meta.guid) flashColor("output", signal.name);
    };

    socketClient.on(eventNames.inboundSignal, inboundSignalListener);
    socketClient.on(eventNames.outboundSignal, outboundSignalListener);

    return () => {
      socketClient.off(eventNames.inboundSignal, inboundSignalListener);
      socketClient.off(eventNames.outboundSignal, outboundSignalListener);
    };
  });

  const viewableInputs = useMemo(
    () =>
      Object.entries(node.input)
        .filter(([name]) => name.startsWith("@"))
        .map((x) => ({
          name: x[0],
          dataKey: x[1],
        })),
    [node.input]
  );

  const views = useViews(viewableInputs);

  const [activeViewName, setActiveViewName] = useState<string | null>(null);

  const onCustomView = (signal: ControlSignalWithTypeAndNode) => {
    const isCustomView = signal.name.startsWith("@");
    const shouldOpenCustomView = signal.altKey ? (isCustomView ? true : false) : false;

    if (shouldOpenCustomView) {
      createCustomView(signal.value, node, dataCache);
    } else {
      dispatch(uiSlice.actions.createEditViewWindow({ ...signal, nodeName: node.meta.name }));
    }
  };

  const inputControls = Object.entries(node.input)
    .filter(([name]) => !name.startsWith("_"))
    .map(
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

  const stateControls = Object.entries(node.state)
    .filter(([name]) => !name.startsWith("_"))
    .map(
      ([name, dataKey]) =>
        new Control({
          name,
          dataKey,
          bindType: "none",
          readonly: true,
        })
    );

  const outputControls = Object.entries(node.output)
    .filter(([name]) => !name.startsWith("_"))
    .map(
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

  const activeView = views.find((x) => x.name === activeViewName);

  const viewButtons = [
    <ViewTabButton
      key="<-all"
      name="Properties"
      onClick={() => setActiveViewName(null)}
      active={activeView === undefined}
    />,
  ].concat(
    views.map((view) => (
      <ViewTabButton
        key={view.name}
        name={view.name}
        onClick={() => setActiveViewName(view.name)}
        active={activeView ? activeView.name === view.name : false}
      />
    ))
  );

  const [showContextMenu, setShowContextMenu] = useState(false);

  return (
    <WinBox
      width={window.innerWidth * 0.4}
      right={0}
      x="right"
      height="100%"
      background="grey"
      title={`PropertyEditor <${node.meta.name}>`}
      noClose
      noAnimation
      noMax
      noMin
      noFull
      customControls={[
        {
          class: "wb-icon",
          image: moreIconUrl,
          click: () => {
            setShowContextMenu(!showContextMenu);
          },
        },
      ]}
    >
      <div ref={ref} className="propertyEditor" style={styles}>
        {showContextMenu && (
          <ContextMenu
            node={node}
            onItemSelected={() => {
              setShowContextMenu(false);
            }}
          />
        )}

        {viewButtons.length > 1 && <div style={{ display: "flex", marginTop: "2px" }}>{viewButtons}</div>}

        {activeView && <InlineView view={activeView} node={node} />}

        {activeView === undefined && (
          <div
            style={{
              height: "85vh",
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
        )}
      </div>
    </WinBox>
  );
};
