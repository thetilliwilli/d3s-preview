import { AbstractRequest, eventNames } from "@d3s/event";
import { NetworkState } from "@d3s/state";
import { Dictionary, EventEmitter } from "@d3s/utils";
import * as requestHandlerMap from "../../request-handler";
import { RuntimeNode } from "../node/node";
import { NodeBuilder } from "../node/node-builder";
import { Signal } from "../node/signal";
import { IDataService } from "./i-data-service";
import { RuntimeSettings } from "./runtime-settings";

export class Runtime extends EventEmitter {
  public resolveNode: (nodeUri: string) => Promise<NodeBuilder>;
  public logToHost: (log: any) => void;
  public data: IDataService;
  public promptAi: (prompt: string) => Promise<string>;
  public state = new NetworkState();
  public nodes: Dictionary<RuntimeNode> = {};
  public instances: Dictionary<{ [key: string | number | symbol]: any }> = {};

  constructor(settings: RuntimeSettings) {
    super();

    this.resolveNode = settings.resolveNode;
    this.logToHost = settings.logToHost;
    this.data = settings.dataService;
    this.promptAi = settings.promptAi;

    this.handle = this.handle.bind(this);
    this.logSignal = this.logSignal.bind(this);

    this.on(eventNames.inboundSignal, this.logSignal);
    this.on(eventNames.outboundSignal, this.logSignal);

    this.toJSON.bind(this);
  }

  public async handle(request: AbstractRequest): Promise<any> {
    try {
      //@ts-ignore
      const RequestHandlerClass = requestHandlerMap[request.type + "Handler"];
      const requestHandler = new RequestHandlerClass();
      const oldStateStr = JSON.stringify(this.state);
      const result = await requestHandler.handle({ app: this, event: request });
      const newStateStr = JSON.stringify(this.state);
      if (newStateStr !== oldStateStr) this.emit(eventNames.state, this.state); // TODO для уменьшения колва сериализаций, переделать на отправку newStateStr
      return result;
    } catch (error) {
      console.error(error);
    }
  }

  public getData(dataRequest: { nodeGuid: string; scope: string; property: string }) {
    function select(value: any, selector: string, separator: string) {
      const paths = selector.split(separator);
      const result = paths.reduce((obj, path) => obj[path], value);
      return result;
    }
    try {
      const dataKey = select(
        this.state,
        ["nodes", dataRequest.nodeGuid, dataRequest.scope, dataRequest.property].join("/"),
        "/"
      );
      const data = this.data.get(dataKey);
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  public toJSON() {
    return {
      state: this.state,
      data: this.data,
    };
  }

  private logSignal(signal: Signal) {
    const logLength = 200;
    const node = this.state.nodes[signal.nodeGuid];
    const shortGuid = node.meta.guid.slice(0, 8);
    const shortUri = node.meta.nodeUri.split(".").pop();
    const shortName = node.meta.name.replace(/[\r\n]+/g, " ").slice(0, 20);
    const dataString = Array.isArray(signal.data) ? `[${signal.data}]` : "" + signal.data;
    const shortDataString = JSON.stringify(
      dataString.length > logLength ? dataString.slice(0, logLength) + "..." : dataString
    ).slice(1, -1);
    const reaction = `[${shortUri}: "${shortName}"].${signal.type}.${signal.name} (${shortDataString})`;
    this.logToHost(`${shortGuid} ${reaction}`);
  }
}
