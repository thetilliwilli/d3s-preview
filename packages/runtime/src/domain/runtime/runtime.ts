import { AbstractRequest, eventNames, LoadNetworkRequest, SendSignalRequest } from "@d3s/event";
import { NodeHost } from "@d3s/runtime-host-node";
import { AppStateWithData, DataState, NetworkState } from "@d3s/state";
import { Dictionary, EventEmitter } from "@d3s/utils";
import * as requestHandlerMap from "../../request-handler/index.js";
import { InMemoryDataService } from "../../service/data-service.js";
import { NodeResolver } from "../../service/node-resolver.js";
import { NodeBuilder } from "../node/node-builder.js";
import { RuntimeNode } from "../node/node.js";
import { Signal } from "../node/signal.js";
import { AppSettings } from "./app-settings.js";

export class Runtime extends EventEmitter {
  private host: NodeHost;
  private settings: AppSettings;

  private appState: AppStateWithData;
  public data!: InMemoryDataService;
  public get networkState(): NetworkState {
    return this.appState.state;
  }
  public nodes: Dictionary<RuntimeNode> = {};
  public instances: Dictionary<{ [key: string | number | symbol]: any }> = {};

  constructor(host: NodeHost, settings: AppSettings, appState: AppStateWithData) {
    super();
    
    this.host = host;
    this.settings = settings;
    this.appState = this.shrinkAppState(appState);
  }

  public async init() {
    // this.appState = await this.loadAppState();
    this.data = new InMemoryDataService(this.appState.data);

    this.handle = this.handle.bind(this);
    this.logSignal = this.logSignal.bind(this);

    this.on(eventNames.inboundSignal, this.logSignal);
    this.on(eventNames.outboundSignal, this.logSignal);

    // this.toJSON.bind(this);

    await this.handle(new LoadNetworkRequest(this.appState.state));

    //#region ==============> INCOMING host -> runtime
    this.host.communication.incoming.on("/websocket/message", (appEvent: AbstractRequest) => {
      this.handle(appEvent);
    });
    this.host.communication.incoming.on("/websocket/getNetworkState", (callback) => {
      callback(this.networkState);
    });
    this.host.communication.incoming.on("/websocket/getDataByDataKey", (dataKey, callback) => {
      const data = this.data.get(dataKey);
      callback(data);
    });
    this.host.communication.incoming.on("/stdin/request", (request) => {
      this.handle(request);
    });
    this.host.communication.incoming.on("/rest/request", (request) => {
      this.handle(request);
    });
    // TODO исправить - листенеры должны отсоединться при по окончанию соеденинияя - чтобы не весели бесконечно
    this.host.communication.incoming.on("/rest/channelEventStream", ({ emitEventData, request }) => {
      const { nodeGuid, scope, property, isDataOnly } = request;

      this.on(scope === "input" ? eventNames.inboundSignal : eventNames.outboundSignal, (signal) => {
        if (signal.nodeGuid === nodeGuid && property === signal.name) {
          const data = isDataOnly ? this.getNodeData(nodeGuid, scope, property) : signal;
          const dataString = JSON.stringify(data);
          emitEventData(dataString);
        }
      });
    });

    this.host.communication.incoming.on("/rest/task", async ({ task, emitTaskResult }) => {
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

    this.host.communication.incoming.on("/rest/invokeAndWaitResult", async ({ request, emitTaskResult }) => {
      const result = await this.handle(request);
      emitTaskResult(result);
    });

    this.host.communication.incoming.on(
      "/rest/invokeCustomWallarmIntergration",
      ({ nodeGuid, property, wallarmSignal }) => {
        this.handle(new SendSignalRequest(nodeGuid, property, wallarmSignal, "input"));
      }
    );

    this.host.communication.incoming.on("/rest/getData", async ({ params, returnData }) => {
      const data = await this.getData(params);
      returnData(data);
    });
    //#endregion

    //#region ==============> OUTCOMING runtime -> host
    this.on(eventNames.networkState, () => {
      this.host.communication.outcoming.emit(eventNames.networkState, this.networkState);
    });
    this.on(eventNames.outboundSignal, (outboundSignal) => {
      this.host.communication.outcoming.emit(eventNames.outboundSignal, outboundSignal);
    });
    this.on(eventNames.inboundSignal, (inboundSignal) => {
      this.host.communication.outcoming.emit(eventNames.inboundSignal, inboundSignal);
    });
    this.data.on(eventNames.data, ({ key, value }) => {
      const dataChannel = `${eventNames.data}/${key}`;
      this.host.communication.outcoming.emit(eventNames.data, dataChannel, value);
    });
    //#endregion

    //@ts-ignore
    await this.host.init();
  }

  public async resolveNode(nodeUri: string): Promise<NodeBuilder> {
    const nodeResolver = new NodeResolver();
    const result = nodeResolver.resolve(nodeUri);
    return result;
  }

  public logToHost(message: string) {
    console.log(message);
  }

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

  public async handle(request: AbstractRequest) {
    try {
      //@ts-ignore
      const RequestHandlerClass = requestHandlerMap[request.type + "Handler"];
      const requestHandler = new RequestHandlerClass();

      const oldStateStr = JSON.stringify(this.networkState);
      const oldDataVersion = this.data.version;

      const result = await requestHandler.handle({ app: this, event: request });

      const newStateStr = JSON.stringify(this.networkState);
      const newDataVersion = this.data.version;
      // TODO для уменьшения кол-ва сериализаций, переделать на отправку newStateStr
      if (newStateStr !== oldStateStr) {
        this.emit(eventNames.networkState, this.networkState);
      }

      if (newStateStr !== oldStateStr || oldDataVersion !== newDataVersion) {
        const appContent = JSON.stringify(this.serializeDto(), null, " ");
        this.host.saveApp(appContent);
      }

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
        this.networkState,
        ["nodes", dataRequest.nodeGuid, dataRequest.scope, dataRequest.property].join("/"),
        "/"
      );
      const data = this.data.get(dataKey);
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  public serializeDto(): AppStateWithData {
    return {
      ...this.appState,
      data: this.data.serializeDto(),
    };
  }

  private getNodeData(nodeGuid: string, scope: string, property: string): any {
    return (scope === "input" ? this.networkState.nodes[nodeGuid].input : this.networkState.nodes[nodeGuid].output)[
      property
    ];
  }

  private logSignal(signal: Signal) {
    const logLength = 200;
    const node = this.networkState.nodes[signal.nodeGuid];
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

  // private async loadAppState(): Promise<AppStateWithData> {
  //   let appContent = await this.host.loadApp();
  //   let appState = JSON.parse(appContent) as AppStateWithData;
  //   appState = this.shrinkAppState(appState);
  //   return appState;
  // }

  private shrinkAppState(appState: AppStateWithData): AppStateWithData {
    /** old to new DataKey mapping */
    const keyMap: any = {};
    const shrinkedData: DataState = [];

    Object.values(appState.state.nodes)
      .flatMap((node) => [node.input, node.state, node.output])
      .forEach((nameToDataKey) => {
        for (const propName in nameToDataKey) {
          const oldDataKey = nameToDataKey[propName];

          if (!keyMap[oldDataKey]) {
            keyMap[oldDataKey] = shrinkedData.length;
            shrinkedData.push(appState.data[oldDataKey]);
          }

          nameToDataKey[propName] = keyMap[oldDataKey];
        }
      });

    appState.data = shrinkedData;

    return appState;
  }
}
