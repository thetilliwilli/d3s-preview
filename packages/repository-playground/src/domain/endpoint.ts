import crypto from "crypto";

export class Endpoint {
  guid = crypto.randomUUID();
  name: string = this.guid;
  method = "GET";
  url = "";
  headers = {};
  body: any = null;
  constructor(endpoint?: Partial<Endpoint>) {
    if (endpoint) Object.assign(this, JSON.parse(JSON.stringify(endpoint)));
  }
  static empty() {
    return new Endpoint();
  }
}
