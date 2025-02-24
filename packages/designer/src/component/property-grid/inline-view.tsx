import { DataKey, NodeState } from "@d3s/state";
import { useEffect, useRef } from "react";
import { getNodeContent } from "./custom-view";
import { dataCache } from "../../service/data-cache";

const communication = new BroadcastChannel("customView");

export function InlineView(props: {
  view: {
    name: string;
    dataKey: DataKey;
    value: any;
  };
  node: NodeState;
}) {
  const { view, node } = props;
  const htmlContent = view.value + "";
  // const iframeSrc = `data:text/html;charset=utf-8;base64,${encodeToBase64(htmlContent)}`;

  const ref = useRef<HTMLIFrameElement>(null);
  const nodeContent = getNodeContent(node, dataCache);
  const useEffectKey = JSON.stringify(nodeContent.input);

  useEffect(() => {
    const frameWindow = ref.current?.contentWindow?.window;

    if (!frameWindow) return;

    (frameWindow as any).$view = {
      node: nodeContent,
      emit(name: string, data: any) {
        const signal = { nodeGuid: this.node.meta.guid, type: "input", name, data };
        communication.postMessage(signal);
      },
    };

    // ref.current.src = iframeSrc;
    frameWindow.document.write(htmlContent);
  }, [htmlContent, useEffectKey]);

  return <iframe key={view.name} style={{ width: "100%", height: "80vh", overflow: "auto" }} ref={ref}></iframe>;
}
