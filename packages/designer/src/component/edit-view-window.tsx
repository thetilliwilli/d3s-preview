import { useEffect, useRef, useState } from "react";
import WinBox from "react-winbox";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { uiSlice } from "../slice/ui-slice";

export function EditViewWindow() {
    const dispatch = useAppDispatch();
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const options = useAppSelector((state) => state.ui.editViewWindowOptions);
    // useEffect(() => {

    //     if (iframeLoaded) {
    //         iframeRef.current?.contentWindow?.postMessage({ ...options, messageType: "edit" });
    //     }

    //     // // destroy
    //     // return () => {
    //     //     if (options)
    //     //         dispatch(uiSlice.actions.destroyEditViewWindow(options));
    //     // };

    //     // dependencies
    // }, [iframeLoaded, options]);

    if (options === undefined) return <></>;
    const title = `${options.nodeGuid.slice(0, 8)} [${options.nodeName}].${(options as any).bindType}.${options.name}`;

    return (
        <WinBox width={600} height={600} x={0} y={0} background="grey" title={title} onClose={() => {
            dispatch(uiSlice.actions.destroyEditViewWindow());
        }}>
            <iframe
                ref={iframeRef}
                src="editor.html"
                onLoad={() => {
                    // setIframeLoaded(true);
                    iframeRef.current?.contentWindow?.postMessage({ ...options, messageType: "edit" });
                }}
            ></iframe>
        </WinBox>
    );
}