import { eventNames } from "@d3s/event";
import { DataKey, NetworkState } from "@d3s/state";
import EventEmitter from "events";
import { Socket, io } from "socket.io-client";
import { store } from "../app/store";
import { networkSlice } from "../slice/network-slice";

class SocketClientService extends EventEmitter {
  private isInitted = false;
  private socket: Socket;
  private connectionUri = "http://localhost:5000";

  constructor() {
    super();

    const connectionUri = import.meta.env.PROD ? window.location.host : this.connectionUri;

    this.socket = io(connectionUri, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }

  init() {
    if (!this.isInitted) {
      this.socket.connect();

      this.socket.on(eventNames.networkState, (networkState: NetworkState) => {
        store.dispatch(networkSlice.actions.replaceState(networkState));
      });

      this.socket.on(eventNames.inboundSignal, (signal: any) => {
        this.emit(eventNames.inboundSignal, signal);
      });

      this.socket.on(eventNames.outboundSignal, (signal: any) => {
        this.emit(eventNames.outboundSignal, signal);
      });

      this.isInitted = true;
    }
  }

  channelOn(channel: string, listener: (data: any) => void) {
    this.socket.on(channel, listener);
  }

  channelOff(channel: string, listener: (data: any) => void) {
    this.socket.off(channel, listener);
  }

  send(message: any, eventName?: string) {
    if (eventName) this.socket.emit(eventName, message);
    else this.socket.send(message);
  }

  async getData(key: DataKey): Promise<any> {
    return new Promise((resolve, _reject) => {
      this.socket.emit("/getData", key, (response: any) => {
        resolve(response);
      });
    });
  }

  async loadNetworkState(): Promise<any> {
    this.socket.emit("/getNetworkState", (networkState: any) => {
      store.dispatch(networkSlice.actions.replaceState(networkState));
    });
  }
}

export const socketClient = new SocketClientService();
