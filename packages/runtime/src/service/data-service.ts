import { DataKey } from "@d3s/state";
import { IDataService } from "@d3s/runtime";
import { EventEmitter } from "@d3s/utils";
import { eventNames } from "@d3s/event";

export class InMemoryDataService extends EventEmitter implements IDataService {
  private items: Map<DataKey, unknown>;

  constructor(items: any[]) {
    super();
    this.items = new Map(items.map((value, index)=>[index,value]));
  }

  public new(value: unknown): DataKey {
    return this.items.set(this.items.size, value).size - 1;
  }

  public set(key: DataKey, value: unknown) {
    if (!this.items.has(key)) throw new Error(`данных не существует или указан неверный ключ: ${key}`);
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

  public toJSON() {
    return Array.from(this.items.values());
  }
}
