import { useEffect, useRef } from "react";
import { networkService } from "../service/network-service/network-service";
import { socketClient } from "../service/socket-client-service";

export const NetworkViewer = () => {
  const paperContainerElement: any = useRef(null);

  useEffect(() => {
    networkService.init(paperContainerElement.current);

    socketClient.loadNetworkState();

    return () => {
      networkService.destroy();
    };
  }, []);

  return <div id="paperContainer" ref={paperContainerElement}></div>;
};
