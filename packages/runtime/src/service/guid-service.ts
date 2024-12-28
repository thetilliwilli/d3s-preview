import { v4 } from "uuid";

export class GuidService {
  static getGuid(): string {
    return v4();
  }
}
