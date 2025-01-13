import { AbstractRequest, eventNames } from "@d3s/event";
import { AppStateWithData } from "@d3s/state";
import { EventEmitter, throttle } from "@d3s/utils";
import bodyParser from "body-parser";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import { createServer as httpsCreateServer } from "https";
import readline from "node:readline";
import { Server } from "socket.io";
import util from "util";
import { AuthService } from "./auth-service.js";
import { config } from "./config.js";
import { HostSettings } from "../domain/host-settings.js";

export class NodeHost {
  public communication = {
    incoming: new EventEmitter(),
    outcoming: new EventEmitter(),
  };

  constructor(private settings: HostSettings) {}

  public async init() {
    this.logToHost(JSON.stringify({ ...config, type: "config" }));

    ["SIGINT", "SIGTERM", "exit", "uncaughtException"].forEach((event) => {
      process.on(event, (error) => {
        console.error(error);
        // в этот механизм не работает поэтому пока что отключили - подумать может бекапирования достаточно? тогда можно выпилить насовем
        // if (this.appFile && this.appRunFile) copyFileSync(this.appRunFile, this.appFile);
        process.exit(0);
      });
    });

    if(this.settings.api)
      await this.webserverInit(config.port, config.host);
  }

  public logToHost(message: string) {
    if (config.verbose) console.log(message);
  }

  // public async loadApp(): Promise<string> {
  //   const appSource = this.settings.appSource;

  //   const isRemoteLocation = appSource.startsWith("http:") || appSource.startsWith("https:");
  //   const appJsonContent = await (async () => {
  //     try {
  //       return isRemoteLocation ? fetch(appSource).then((x) => x.text()) : fs.promises.readFile(appSource, "utf8");
  //     } catch (error) {
  //       console.error(`failed to load app: ${appSource}`);
  //       throw error;
  //     }
  //   })();

  //   return appJsonContent;
  // }

  public saveApp = throttle((appContent: string) => {
    if (this.settings.save) fs.writeFileSync(this.settings.save, appContent);
  }, 1500);

  private async webserverInit(port: number, host: string) {
    const app = express();

    const server =
      config.tls === false
        ? createServer(app)
        : httpsCreateServer(
            {
              key: fs.readFileSync(config.cert + ".key"),
              cert: fs.readFileSync(config.cert + ".crt"),
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

      socket.on("/getNetworkState", (callback) => {
        this.communication.incoming.emit("/websocket/getNetworkState", callback);
      });

      socket.on("message", (appEvent: AbstractRequest) => {
        // hack: дублирование кода как в express.post()
        this.communication.incoming.emit("/websocket/message", appEvent);
      });

      socket.on("/getData", (dataKey, callback) => {
        this.communication.incoming.emit("/websocket/getDataByDataKey", dataKey, callback);
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

    app.get("/channel/root/:nodeGuid/:scope/:property", (req, res) => {
      res.writeHead(200, {
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream; charset=utf-8",
      });

      // TODO исправить - листенеры должны отсоединться при по окончанию соеденинияя - чтобы не весели бесконечно
      this.communication.incoming.emit("/rest/channelEventStream", {
        emitEventData: (eventData: string) => {
          res.write(`data: ${eventData}\n\n`);
        },
        request: {
          nodeGuid: req.params.nodeGuid,
          scope: req.params.scope,
          property: req.params.property,
          isDataOnly: "dataOnly" in req.query,
        },
      });

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
          this.communication.incoming.emit("/stdin/request", request);
        } catch (_) {}
      });

    //
    //==============> INCOME webserver->runtime
    //
    app.use(bodyParser.json());

    app.post("/task", (req, res) => {
      this.communication.incoming.emit("/rest/task", {
        task: req.body,
        emitTaskResult: (result: any) => {
          res.end(JSON.stringify(result));
        },
      });
    });

    app.post("/invoke", (req, res) => {
      this.communication.incoming.emit("/rest/invokeAndWaitResult", {
        request: req.body,
        emitTaskResult: (result: any) => {
          if (result.error) result.error = util.inspect(result.error);
          res.send(result);
        },
      });
    });

    // для интеграции с wallarm
    // мы не может управлять кастомным форматом данных которые отправляет Wallarm
    // поэтому под него нужен кастомнй ендпоинт
    app.post("/signal/:nodeGuid/:scope/:property", (req, res) => {
      if (req.params.scope === "input") {
        res.send({ ok: true });
        this.communication.incoming.emit("/rest/invokeCustomWallarmIntergration", {
          nodeGuid: req.params.nodeGuid,
          property: req.params.property,
          wallarmSignal: req.body,
        });
      }
    });

    app.post("*", (req, res) => {
      res.send(JSON.stringify({ ok: true }));
      this.communication.incoming.emit("/rest/request", req.body);
    });

    app.get("/data/:nodeGuid/:scope/:property", (req, res) => {
      this.communication.incoming.emit("/rest/getData", {
        params: req.body,
        returnData: (data: any) => {
          res.type("application/json");
          res.send(JSON.stringify(data));
        },
      });
    });

    //
    //==============> OUTCOME runtime->webserver
    //
    this.communication.outcoming.on(eventNames.networkState, (networkState) => {
      socketIoServer.emit(eventNames.networkState, networkState);
    });
    this.communication.outcoming.on(eventNames.outboundSignal, (outboundSignal) => {
      socketIoServer.emit(eventNames.outboundSignal, outboundSignal);
    });
    this.communication.outcoming.on(eventNames.inboundSignal, (inboundSignal) => {
      socketIoServer.emit(eventNames.inboundSignal, inboundSignal);
    });
    this.communication.outcoming.on(eventNames.data, (dataChannel, value) => {
      socketIoServer.emit(dataChannel, value);
    });

    server.listen(port, host, () => {
      this.logToHost(`server.listen: ${config.tls ? "https" : "http"}://${config.token}@localhost:${config.port}`);
    });
  }
}
