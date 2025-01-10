import { AbstractRequest, eventNames, LoadNetworkRequest, SendSignalRequest } from "@d3s/event";
import { NodeHost } from "@d3s/runtime-host-node";
import { AppStateWithData, NetworkState } from "@d3s/state";
import { Dictionary, EventEmitter } from "@d3s/utils";
import * as requestHandlerMap from "../../request-handler/index.js";
import { InMemoryDataService } from "../../service/data-service.js";
import { NodeResolver } from "../../service/node-resolver.js";
import { NodeBuilder } from "../node/node-builder.js";
import { RuntimeNode } from "../node/node.js";
import { Signal } from "../node/signal.js";

export class Runtime extends EventEmitter {
  public async resolveNode(nodeUri: string): Promise<NodeBuilder> {
    const nodeResolver = new NodeResolver();
    const result = nodeResolver.resolve(nodeUri);
    return result;
  }

  public logToHost(message: string) {
    console.log(message);
  }
  public data!: InMemoryDataService;
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
  public get state(): NetworkState {
    return this.appState.state;
  }
  public nodes: Dictionary<RuntimeNode> = {};
  public instances: Dictionary<{ [key: string | number | symbol]: any }> = {};

  constructor(private appState: AppStateWithData) {
    super();
  }

  public async init() {
    this.data = new InMemoryDataService(this.appState.data);

    this.handle = this.handle.bind(this);
    this.logSignal = this.logSignal.bind(this);

    this.on(eventNames.inboundSignal, this.logSignal);
    this.on(eventNames.outboundSignal, this.logSignal);

    // this.toJSON.bind(this);

    await this.handle(new LoadNetworkRequest(this.appState.state));

    const nodeHost = new NodeHost();
    //#region ==============> INCOMING host -> runtime
    nodeHost.communication.incoming.on("/websocket/message", (appEvent: AbstractRequest) => {
      this.handle(appEvent);
    });
    nodeHost.communication.incoming.on("/websocket/getNetworkState", (callback) => {
      const networkState = this.state;
      callback(networkState);
    });
    nodeHost.communication.incoming.on("/websocket/getDataByDataKey", (dataKey, callback) => {
      const data = this.data.get(dataKey);
      callback(data);
    });
    nodeHost.communication.incoming.on("/stdin/request", (request) => {
      this.handle(request);
    });
    nodeHost.communication.incoming.on("/rest/request", (request) => {
      this.handle(request);
    });
    // TODO исправить - листенеры должны отсоединться при по окончанию соеденинияя - чтобы не весели бесконечно
    nodeHost.communication.incoming.on("/rest/channelEventStream", ({ emitEventData, request }) => {
      const { nodeGuid, scope, property, isDataOnly } = request;

      this.on(scope === "input" ? eventNames.inboundSignal : eventNames.outboundSignal, (signal) => {
        if (signal.nodeGuid === nodeGuid && property === signal.name) {
          const data = isDataOnly ? this.getNodeData(nodeGuid, scope, property) : signal;
          const dataString = JSON.stringify(data);
          emitEventData(dataString);
        }
      });
    });

    nodeHost.communication.incoming.on("/rest/task", async ({ task, emitTaskResult }) => {
      const listener = (signal: Signal) => {
        if (signal.nodeGuid === task.resultSignal.nodeGuid && signal.name === task.resultSignal.name) {
          this.off(eventNames.outboundSignal, listener);
          emitTaskResult(signal.data);
        }
      };

      this.on(eventNames.outboundSignal, listener);

      for (const inputSignal of task.activationSignals) {
        inputSignal.type = "SendSignalRequest";
        await this.handle(inputSignal);
      }
    });

    nodeHost.communication.incoming.on("/rest/invokeAndWaitResult", async ({ request, emitTaskResult }) => {
      const result = await this.handle(request);
      emitTaskResult(result);
    });

    nodeHost.communication.incoming.on(
      "/rest/invokeCustomWallarmIntergration",
      ({ nodeGuid, property, wallarmSignal }) => {
        this.handle(new SendSignalRequest(nodeGuid, property, wallarmSignal, "input"));
      }
    );

    nodeHost.communication.incoming.on("/rest/getData", async ({ params, returnData }) => {
      const data = await this.getData(params);
      returnData(data);
    });
    //#endregion

    //#region ==============> OUTCOMING runtime -> host
    this.on(eventNames.networkState, () => {
      nodeHost.communication.outcoming.emit(eventNames.networkState, this.state);
    });
    this.on(eventNames.outboundSignal, (outboundSignal) => {
      nodeHost.communication.outcoming.emit(eventNames.outboundSignal, outboundSignal);
    });
    this.on(eventNames.inboundSignal, (inboundSignal) => {
      nodeHost.communication.outcoming.emit(eventNames.inboundSignal, inboundSignal);
    });
    this.data.on(eventNames.data, ({ key, value }) => {
      const dataChannel = `${eventNames.data}/${key}`;
      nodeHost.communication.outcoming.emit(eventNames.data, dataChannel, value);
    });
    //#endregion

    //@ts-ignore
    await nodeHost.init();
  }

  private getNodeData(nodeGuid: string, scope: string, property: string): any {
    return (scope === "input" ? this.state.nodes[nodeGuid].input : this.state.nodes[nodeGuid].output)[property];
  }

  public async handle(request: AbstractRequest) {
    try {
      //@ts-ignore
      const RequestHandlerClass = requestHandlerMap[request.type + "Handler"];
      const requestHandler = new RequestHandlerClass();
      const oldStateStr = JSON.stringify(this.state);
      const result = await requestHandler.handle({ app: this, event: request });
      const newStateStr = JSON.stringify(this.state);
      if (newStateStr !== oldStateStr) this.emit(eventNames.networkState, this.state); // TODO для уменьшения колва сериализаций, переделать на отправку newStateStr
      return { result };
    } catch (error) {
      console.error(error);
      return { error };
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

  public getAppState(): AppStateWithData {
    return {
      state: this.state,
      data: this.data.getState(),
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
