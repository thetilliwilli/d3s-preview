import { DataKey } from "@d3s/state";
import { socketClient } from "./socket-client-service";
import { eventNames } from "@d3s/event";

export class DataCache {
  private entries = new Map();

  get(dataKey: DataKey) {
    return this.entries.get(dataKey);
  }

  on(dataKey: DataKey, listener: (data: unknown) => void) {

    socketClient.channelOn(eventNames.data, (dataKeyValue: { key: DataKey; value: unknown }) => {
      if (dataKey === dataKeyValue.key) {
        this.entries.set(dataKey, dataKeyValue.value);
        listener(dataKeyValue.value);
      }
    });

    if (this.entries.has(dataKey)) {
      listener(this.entries.get(dataKey));
    } else {
      socketClient.getData(dataKey).then((data) => {
        this.entries.set(dataKey, data);
        listener(data);
      });
    }
  }

  off(dataKey: DataKey, listener: (data: any) => void) {
    const channel = `${eventNames.data}/${dataKey}`;
    socketClient.channelOff(channel, listener);
  }
}

export const dataCache = new DataCache();
