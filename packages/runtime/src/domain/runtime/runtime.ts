import { AbstractRequest, eventNames, LoadNetworkRequest } from "@d3s/event";
import { AppStateWithData, NetworkState } from "@d3s/state";
import { Dictionary, EventEmitter } from "@d3s/utils";
import * as requestHandlerMap from "../../request-handler/index.js";
import { RuntimeNode } from "../node/node.js";
import { NodeBuilder } from "../node/node-builder.js";
import { Signal } from "../node/signal.js";
import { IDataService } from "./i-data-service.js";
import { RuntimeSettings } from "./runtime-settings.js";
import { NodeResolver } from "../../service/node-resolver.js";
import { InMemoryDataService } from "../../service/data-service.js";

export class Runtime extends EventEmitter {
  // public resolveNode!: (nodeUri: string) => Promise<NodeBuilder>;
  public async resolveNode(nodeUri: string): Promise<NodeBuilder> {
    const nodeResolver = new NodeResolver();
    const result = nodeResolver.resolve(nodeUri);
    return result;
  }

  // public logToHost!: (log: any) => void;
  public logToHost(message: string) {
    // if (config.verbose) console.log(message);
    console.log(message);
  }
  public data!: IDataService;
  // public promptAi!: (prompt: string) => Promise<string>;
  public async promptAi(prompt: string) {
    throw new Error(`not implemetned`);
    const result = await fetch("config.aiEndpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${"config.aiToken"}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        stream: false,
        messages: [
          // { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      }),
    }).then((x) => x.json());

    return result.choices[0].message.content as string;
  }
  public state = new NetworkState();
  public nodes: Dictionary<RuntimeNode> = {};
  public instances: Dictionary<{ [key: string | number | symbol]: any }> = {};

  constructor(/* settings: RuntimeSettings */ private runtimeSpecifier?: "node" | "web") {
    super();
  }

  public async init(appStateWithData: AppStateWithData) {
    // this.resolveNode = nodeHost.resolveNode;
    // this.logToHost = nodeHost.logToHost;
    // this.data = nodeHost.dataService;
    this.data = new InMemoryDataService(appStateWithData.data);
    // this.promptAi = nodeHost.promptAi;

    this.handle = this.handle.bind(this);
    this.logSignal = this.logSignal.bind(this);

    this.on(eventNames.inboundSignal, this.logSignal);
    this.on(eventNames.outboundSignal, this.logSignal);

    this.toJSON.bind(this);

    await this.handle(new LoadNetworkRequest(appStateWithData.state));

    const { NodeHost } = await import("@d3s/runtime-host-node");
    const nodeHost = new NodeHost();
    //@ts-ignore
    await nodeHost.init(this, this.data);
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
