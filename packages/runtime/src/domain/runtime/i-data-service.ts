import { DataKey } from "@d3s/state";

export interface IDataService {
  "new"(value: unknown): DataKey;
  set(key: DataKey, value: unknown): void;
  has(key: DataKey) : boolean;

  get(key: DataKey): unknown;
}
