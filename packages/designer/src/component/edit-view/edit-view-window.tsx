import { useEffect, useRef, useState } from "react";
import WinBox from "react-winbox";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { EditViewWindowOptions } from "../../domain/edit-view-window-options";
import { uiSlice } from "../../slice/ui-slice";
import { CreateAiCode } from "./create-ai-code";

const communicationLanguage = new BroadcastChannel("editView.language");

export function EditViewWindow() {
  const dispatch = useAppDispatch();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const options = useAppSelector((state) => state.ui.editViewWindowOptions);
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    function onMessage(message: MessageEvent) {
      setLanguage(message.data.newLanguage);
    }
    communicationLanguage.addEventListener("message", onMessage);
    return () => {
      communicationLanguage.removeEventListener("message", onMessage);
    };
  }, []);

  if (options === undefined) return <></>;

  const title = `${options.nodeGuid.slice(0, 8)} [${options.nodeName}].${(options as any).bindType}.${options.name}`;

  return (
    <WinBox
      id="edit-view-window"
      width={window.innerWidth * 0.4}
      height={600}
      x={0}
      y={0}
      background="grey"
      title={title}
      noMin
      onClose={() => {
        dispatch(uiSlice.actions.destroyEditViewWindow());
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, padding: "8px" }}>
          <CreateAiCode
            options={options}
            onCodeGenerated={(newOptions: EditViewWindowOptions) => {
              dispatch(uiSlice.actions.createEditViewWindow(newOptions));
            }}
            language={language}
          />
        </div>
        <div style={{ flex: 11 }}>
          <iframe
            key={options.value}
            ref={iframeRef}
            src="editor.html"
            onLoad={() => {
              iframeRef.current?.contentWindow?.postMessage({
                ...options,
                messageType: "edit",
                defaultLanguage: language,
              });
            }}
          ></iframe>
        </div>
      </div>
    </WinBox>
  );
}
