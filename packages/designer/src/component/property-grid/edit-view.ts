import { TypeTag } from "./input-control/type-tag";

export function createEditView(editMessage: { name: string; value: any; type: TypeTag; nodeGuid: string, nodeName:string }) {
  const w = window.open("editor.html");
  w?.addEventListener("load", () => {
    w?.postMessage({ ...editMessage, messageType: "edit" });
  });
}