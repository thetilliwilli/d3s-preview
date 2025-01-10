import { AbstractRequest, LoadNetworkRequest, SendSignalRequest, eventNames } from "@d3s/event";
import { NodeBuilder, Runtime, Signal } from "@d3s/runtime";
import { AppStateWithData, DataKey } from "@d3s/state";
import { throttle } from "@d3s/utils";
import bodyParser from "body-parser";
import express from "express";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { createServer } from "http";
import { createServer as httpsCreateServer } from "https";
import readline from "node:readline";
import { Server } from "socket.io";
import { AuthService } from "./auth-service.js";
import { config } from "./config.js";
import { InMemoryDataService } from "./data-service.js";
import { NodeResolver } from "./node-resolver.js";
import util from "util";

export class NodeHost {
  private appLocation = config.appLocation;
  private dataService!: InMemoryDataService;
  private runtime!: Runtime;

  constructor() {
    console.log(`NOdeHost constructor`);
  }
  public async init(runtime: Runtime, dataService:InMemoryDataService) {
    console.log(`NOdeHost init`);
    // return;
    this.logToHost(JSON.stringify({ ...config, type: "config" }));

    // const appStateWithData = this.getState();

    // this.dataService = new InMemoryDataService(appStateWithData.data);
    this.dataService = dataService;

    this.runtime = runtime;
    // this.runtime = new Runtime({
    //   resolveNode: this.resolveNode,
    //   logToHost: this.logToHost,
    //   dataService: this.dataService,
    //   promptAi: this.getPromptResult,
    // });

    ["SIGINT", "SIGTERM", "exit", "uncaughtException"].forEach((event) => {
      process.on(event, (error) => {
        console.error(error);
        // в этот механизм не работает поэтому пока что отключили - подумать может бекапирования достаточно? тогда можно выпилить насовем
        // if (this.appFile && this.appRunFile) copyFileSync(this.appRunFile, this.appFile);
        process.exit(0);
      });
    });

    // await this.runtime.handle(new LoadNetworkRequest(appStateWithData.state));

    await this.webserverInit(config.port, config.host);
  }

  public logToHost(message: string) {
    if (config.verbose) console.log(message);
  }

  private getState(): AppStateWithData {
    return this.appLocation && existsSync(this.appLocation)
      ? JSON.parse(readFileSync(this.appLocation, "utf8"))
      : new AppStateWithData();
  }

  private saveState = throttle(() => {
    const stateStr = JSON.stringify(this.runtime, null, " ");
    if (this.appLocation) writeFileSync(this.appLocation, stateStr);
  }, 3000);

  public async resolveNode(nodeUri: string): Promise<NodeBuilder> {
    const nodeResolver = new NodeResolver();
    const result = nodeResolver.resolve(nodeUri);
    return result;
  }

  public async getPromptResult(prompt: string) {
    const result = await fetch(config.aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.aiToken}`,
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

  private async webserverInit(port: number, host: string) {
    const app = express();

    const server =
      config.tls === false
        ? createServer(app)
        : httpsCreateServer(
            {
              key: readFileSync(config.cert + ".key"),
              cert: readFileSync(config.cert + ".crt"),
            },
            app
          );

    const socketIoServer = new Server(server, {
      cors: {
        origin: "*",
      },
      //100mb для поддержки copy-paste больших нодов
      maxHttpBufferSize: 100 * 1000000,
    });

    socketIoServer.use((socket, next) => {
      if (config.auth === false) return next();

      const isAuthed = AuthService.isAuth(socket.conn.request.headers.authorization || "", config.token);

      if (!isAuthed) next(new Error(`not authed`));
      next();
    });

    socketIoServer.on("connect", (socket) => {
      this.logToHost(JSON.stringify({ type: "socketConnection", status: "connected", socketId: socket.id }));

      // первичная синхронизация состояния
      // чтобы вернуть начальное состояние приложения при подключение нового клиента
      // TODO: MEGAHACK переделать
      socketIoServer.emit(eventNames.state, this.runtime.state);

      socket.on("message", (appEvent: AbstractRequest) => {
        // hack: дублирование кода как в express.post()
        this.runtime.handle(appEvent);
      });

      socket.on("/getData", (dataKey: DataKey, callback) => {
        const data = this.dataService.get(dataKey);
        callback(data);
      });

      socket.on("disconnect", (reason) => {
        this.logToHost(
          JSON.stringify({ type: "socketConnection", status: "disconnected", socketId: socket.id, reason })
        );
      });
    });

    app.use((req, res, next) => {
      // meltening CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // если авторизация выключена
      if (config.auth === false) return next();

      const isAuthed = AuthService.isAuth(req.headers.authorization || "", config.token);

      if (isAuthed) return next();

      res.set("WWW-Authenticate", 'Basic realm="401"');
      res.status(401).send("Authentication required.");
    });

    // serving designer UI files
    app.use(express.static(config.designerDist));

    // обслуживаем файлы из текущей рабочей директории
    if (config.webCwd) app.use("/cwd", express.static(config.cwd));

    function getNodeData(app: Runtime, nodeGuid: string, scope: string, property: string): any {
      return (scope === "input" ? app.state.nodes[nodeGuid].input : app.state.nodes[nodeGuid].output)[property];
    }

    app.get("/channel/root/:nodeGuid/:scope/:property", (req, res) => {
      res.writeHead(200, {
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream; charset=utf-8",
      });

      const { nodeGuid, scope, property } = req.params;
      const isDataOnly = "dataOnly" in req.query;

      if (scope === "input") {
        this.runtime.on(eventNames.inboundSignal, (signal) => {
          if (signal.nodeGuid === nodeGuid && property === signal.name) {
            const data = isDataOnly ? getNodeData(this.runtime, nodeGuid, scope, property) : signal;
            const dataString = JSON.stringify(data);
            res.write(`data: ${dataString}\n\n`);
          }
        });
      }

      // TODO исправить - листенеры должны отсоединться при по окончанию соеденинияя - чтобы не весели бесконечно
      if (scope === "output") {
        this.runtime.on(eventNames.outboundSignal, (signal) => {
          if (signal.nodeGuid === nodeGuid && property === signal.name) {
            const data = isDataOnly ? getNodeData(this.runtime, nodeGuid, scope, property) : signal;
            const dataString = JSON.stringify(data);
            res.write(`data: ${dataString}\n\n`);
          }
        });
      }

      res.on("close", () => {
        res.end();
      });
    });

    //
    //==============> INCOME stdin->runtime
    //

    readline
      .createInterface({
        input: process.stdin,
      })
      .on("line", (line) => {
        try {
          const request = JSON.parse(line);
          this.runtime.handle(request);
        } catch (_) {}
      });

    //
    //==============> INCOME webserver->runtime
    //
    app.use(bodyParser.json());

    app.post("/task", async (req, res) => {
      const listener = (signal: Signal) => {
        if (signal.nodeGuid === req.body.resultSignal.nodeGuid && signal.name === req.body.resultSignal.name) {
          this.runtime.off(eventNames.outboundSignal, listener);
          res.end(JSON.stringify(signal.data));
        }
      };

      this.runtime.on(eventNames.outboundSignal, listener);

      for (const inputSignal of req.body.activationSignals) {
        inputSignal.type = "SendSignalRequest";
        await this.runtime.handle(inputSignal);
      }
    });

    app.post("/invoke", async (req, res) => {
      try {
        const result = await this.runtime.handle(req.body);
        res.send({ result });
      } catch (error) {
        res.send({ error: util.inspect(error) });
      }
    });

    // для интеграции с wallarm
    app.post("/signal/:nodeGuid/:scope/:property", async (req, res) => {
      if (req.params.scope === "input") {
        res.send({ ok: true });
        const signal = new SendSignalRequest(req.params.nodeGuid, req.params.property, req.body, "input");
        this.runtime.handle(signal);
      }
    });

    app.post("*", async (req, res) => {
      res.send({ ok: true });
      this.runtime.handle(req.body);
    });

    app.get("/data/:nodeGuid/:scope/:property", async (req, res) => {
      const data = await this.runtime.getData(req.params);
      res.type("application/json");
      res.send(JSON.stringify(data));
    });

    //
    //==============> OUTCOME runtime->webserver
    //
    this.runtime.on(eventNames.state, (networkState) => {
      socketIoServer.emit(eventNames.state, networkState);
      this.saveState();
    });
    this.runtime.on(eventNames.outboundSignal, (outboundSignal) => {
      socketIoServer.emit(eventNames.outboundSignal, outboundSignal);
    });
    this.runtime.on(eventNames.inboundSignal, (inboundSignal) => {
      socketIoServer.emit(eventNames.inboundSignal, inboundSignal);
    });
    this.dataService.on(eventNames.data, ({ key, value }) => {
      const dataChannel = `${eventNames.data}/${key}`;
      socketIoServer.emit(dataChannel, value);
      this.saveState();
    });

    server.listen(port, host, () => {
      this.logToHost(`server.listen: ${config.tls ? "https" : "http"}://${config.token}@localhost:${config.port}`);
    });
  }
}
