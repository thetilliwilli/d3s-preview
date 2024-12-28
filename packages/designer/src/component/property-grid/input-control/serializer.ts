import { TypeTag } from "./type-tag";

export class Serializor {
  constructor(private dataTag: TypeTag) {}
  public serialize(value: unknown): any {
    switch (this.dataTag) {
      case "string":
        return value;
      case "number":
        return value + "";
      case "boolean":
        return value;
      case "object":
        return JSON.stringify(value);
    }
  }

  public deserialize(value: any): unknown {
    switch (this.dataTag) {
      case "string":
        return value;
      case "number":
        return Number.parseFloat(value);
      case "boolean":
        return value;
      case "object":
        return JSON.parse(value);
    }
  }
}
