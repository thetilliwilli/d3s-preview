import { useRef } from "react";
import WinBox from "react-winbox";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { EditViewWindowOptions } from "../../domain/edit-view-window-options";
import { uiSlice } from "../../slice/ui-slice";
import { CreateAiCode } from "./create-ai-code";

export function EditViewWindow() {
  const dispatch = useAppDispatch();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const options = useAppSelector((state) => state.ui.editViewWindowOptions);

  if (options === undefined) return <></>;

  const title = `${options.nodeGuid.slice(0, 8)} [${options.nodeName}].${(options as any).bindType}.${options.name}`;

  return (
    <WinBox
      width={600}
      height={600}
      x={0}
      y={0}
      background="grey"
      title={title}
      onClose={() => {
        dispatch(uiSlice.actions.destroyEditViewWindow());
      }}
    >
      <CreateAiCode
        options={options}
        onCodeGenerated={(newOptions: EditViewWindowOptions) => {
          dispatch(uiSlice.actions.createEditViewWindow(newOptions));
        }}
      />
      <iframe
        key={options.value}
        ref={iframeRef}
        src="editor.html"
        onLoad={() => {
          iframeRef.current?.contentWindow?.postMessage({ ...options, messageType: "edit" });
        }}
      ></iframe>
    </WinBox>
  );
}
