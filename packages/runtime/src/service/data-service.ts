import { eventNames } from "@d3s/event";
import { DataKey } from "@d3s/state";
import { EventEmitter } from "@d3s/utils";

export class InMemoryDataService extends EventEmitter {
  private items: Map<DataKey, unknown>;
  public version: number;
  constructor(items: unknown[]) {
    super();
    this.items = new Map(items.map((value, index) => [index, value]));
    this.version = 0;
  }

  public new(value: unknown): DataKey {
    this.version++;
    return this.items.set(this.items.size, value).size - 1;
  }

  public set(key: DataKey, value: unknown) {
    if (!this.items.has(key)) throw new Error(`данных не существует или указан неверный ключ: ${key}`);
    this.version++;
    this.items.set(key, value);
    this.emit(eventNames.data, { key, value });
  }

  public has(key: DataKey) {
    return this.items.has(key);
  }

  public get(key: DataKey): unknown {
    if (!this.items.has(key)) throw new Error(`данных не существует или указан неверный ключ: ${key}`);
    return this.items.get(key);
  }

  public serializeDto() {
    return Array.from(this.items.values());
  }
}
