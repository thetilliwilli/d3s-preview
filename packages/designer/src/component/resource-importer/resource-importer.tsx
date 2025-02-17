import { AddEntityRequest, AddNodeRequest, LoadNetworkRequest } from "@d3s/event";
import { useEffect, useRef, useState } from "react";
import { socketClient } from "../../service/socket-client-service";
import { ResourceImporterTile } from "./resource-importer-tile";
import { keyboardService } from "../../service/keyboard";
import { dataTransferTypes } from "../../domain/consts";

const styles: React.CSSProperties = {
  zIndex: 2,

  position: "fixed",
  width: "100%",
  height: "100%",
  top: 0,
  bottom: "100%",
  left: 0,
  right: "100%",

  backgroundColor: "rgba(255,255,255,0.95)",
  color: "black",

  visibility: "hidden",
  pointerEvents: "none",
  textAlign: "center",

  display: "flex",
};

function isDndAllowed(item: { kind: string; type: string }): boolean {
  if (item.kind === "file") return true;
  if (item.kind === "string" && item.type === "text/plain") return true;
  if (item.kind === "string" && item.type === dataTransferTypes.node) return true;

  return false;
}

async function dataTransferToStringContent(dataTransfer: DataTransfer): Promise<string> {
  const firstItem = dataTransfer.items[0];
  if (firstItem.kind === "file") return (await firstItem.getAsFile()?.text()) || "";
  if (firstItem.kind === "string") return dataTransfer.getData(firstItem.type);
  return "";
}

export const ResourceImporter = () => {
  const dataTransferStringContentRef = useRef<string>("");

  const [visibility, setVisibility] = useState(styles.visibility);
  const [isDropped, setIsDropped] = useState(false);
  const [transferItems, setTransferItems] = useState<ReturnType<typeof getTransferItems>>([]);
  const pointerEvents = isDropped ? "auto" : styles.pointerEvents;
  const runtimeStyles = { ...styles, visibility, pointerEvents };

  useEffect(() => {
    const escapeListener = () => {
      setVisibility("hidden");
      setIsDropped(false);
    };

    const dragenterListener = (event: DragEvent) => {
      const transfer = event.dataTransfer;
      if (transfer === null) return;
      if (!isDndAllowed(transfer.items[0])) return;
      event.stopPropagation();
      event.preventDefault();

      setVisibility("visible");
      setTransferItems(getTransferItems(transfer));
    };

    const dragleaveListener = (event: DragEvent) => {
      const transfer = event.dataTransfer;
      if (transfer === null) return;
      if (!isDndAllowed(transfer.items[0])) return;
      event.stopPropagation();
      event.preventDefault();

      setVisibility("hidden");
    };

    const dragoverListener = (event: DragEvent) => {
      const transfer = event.dataTransfer;
      if (transfer === null) return;
      if (!isDndAllowed(transfer.items[0])) return;
      event.stopPropagation();
      event.preventDefault();
    };

    const dropListener = async (event: DragEvent) => {
      const transfer = event.dataTransfer;
      if (transfer === null) return;
      if (!isDndAllowed(transfer.items[0])) return;
      event.stopPropagation();
      event.preventDefault();

      dataTransferStringContentRef.current = await dataTransferToStringContent(transfer);
      setIsDropped(true);
    };

    const listeners = {
      dragenter: dragenterListener,
      dragleave: dragleaveListener,
      dragover: dragoverListener,
      drop: dropListener,
    };

    keyboardService.on("Escape", escapeListener);
    Object.entries(listeners).forEach(([eventName, listener]) => {
      window.document.addEventListener(eventName, listener as any);
    });

    return () => {
      keyboardService.off("Escape", escapeListener);
      Object.entries(listeners).forEach(([eventName, listener]) => {
        window.document.removeEventListener(eventName, listener as any);
      });
    };
  });

  const listItems = transferItems.map((x, i) => (
    <li key={i}>
      <pre>{JSON.stringify(x)}</pre>
    </li>
  ));

  return (
    <div style={runtimeStyles}>
      {isDropped ? (
        <>
          <ResourceImporterTile
            title="AppFile"
            description="импортировать приложение"
            onClick={async () => {
              const networkState = JSON.parse(dataTransferStringContentRef.current);
              socketClient.send(new LoadNetworkRequest(networkState));
              setIsDropped(false);
              setVisibility("hidden");
            }}
          />
          <ResourceImporterTile
            title="Node"
            description="создать нод"
            onClick={() => {
              const nodeUri = dataTransferStringContentRef.current;
              socketClient.send(new AddNodeRequest(nodeUri));
              setIsDropped(false);
              setVisibility("hidden");
            }}
          />
          <ResourceImporterTile
            title="C4"
            description="импорт c4 диаграммы"
            onClick={() => {
              const xmlString = dataTransferStringContentRef.current;
              socketClient.send(new AddEntityRequest(xmlString));
              setIsDropped(false);
              setVisibility("hidden");
            }}
          />
        </>
      ) : (
        <div style={{ flex: 1 }}>
          <div>Доступные объекты:</div>
          <ol style={{ textAlign: "left" }}>{listItems}</ol>
        </div>
      )}
    </div>
  );
};

function getTransferItems(transfer: DataTransfer) {
  return Array.from(transfer?.items || []).map((item, index) => {
    const type = transfer?.types[index] || "";
    const itemKind = item.kind;
    const itemType = item.type;

    return {
      type,
      itemType,
      itemKind,
      effectAllowed: transfer.effectAllowed,
      dropEffect: transfer.dropEffect,
    };
  });
}
