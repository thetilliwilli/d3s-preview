import { AbstractRequest, eventNames } from "@d3s/event";
import { EventEmitter, throttle } from "@d3s/utils";
import bodyParser from "body-parser";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import { createServer as httpsCreateServer } from "https";
import readline from "node:readline";
import { Server } from "socket.io";
import util from "util";
import { HostSettings } from "../domain/host-settings.js";
import { AuthService } from "./auth-service.js";

export class NodeHost {
  public communication = {
    incoming: new EventEmitter(),
    outcoming: new EventEmitter(),
  };

  constructor(private settings: HostSettings) {}

  public async init() {
    this.outcomingEventLog({ name: "host.setings", payload: this.settings });

    ["SIGINT", "SIGTERM", "exit", "uncaughtException"].forEach((event) => {
      process.on(event, (error) => {
        console.error(error);
        // в этот механизм не работает поэтому пока что отключили - подумать может бекапирования достаточно? тогда можно выпилить насовем
        // if (this.appFile && this.appRunFile) copyFileSync(this.appRunFile, this.appFile);
        process.exit(0);
      });
    });

    if (this.settings.api) await this.webserverInit();
  }

  public saveApp = throttle((appContent: string) => {
    if (this.settings.save) fs.writeFileSync(this.settings.save, appContent);
  }, 1500);

  private async webserverInit() {
    const apiSettings = this.settings.api;

    if (apiSettings === undefined) throw new Error(`assert guard`);

    const app = express();

    const server =
      this.settings.tlsCert === undefined
        ? createServer(app)
        : httpsCreateServer(
            {
              key: fs.readFileSync(this.settings.tlsCert + ".key"),
              cert: fs.readFileSync(this.settings.tlsCert + ".crt"),
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
      if (this.settings.auth.enabled === false) return next();

      const isAuthed = AuthService.isAuth(socket.conn.request.headers.authorization || "", this.settings.auth.token);

      if (!isAuthed) next(new Error(`not authed`));
      
      next();
    });

    socketIoServer.on("connect", (socket) => {
      this.outcomingEventLog({ name: "socket.connection", payload: { status: "connected", socketId: socket.id } });

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
        this.outcomingEventLog({
          name: "socket.connection",
          payload: { status: "disconnected", socketId: socket.id, reason },
        });
      });
    });

    app.use((req, res, next) => {
      // meltening CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // если авторизация выключена
      if (this.settings.auth.enabled === false) return next();

      const isAuthed = AuthService.isAuth(req.headers.authorization || "", this.settings.auth.token);

      if (isAuthed) return next();

      res.set("WWW-Authenticate", 'Basic realm="401"');
      res.status(401).send("Authentication required.");
    });

    // обслуживаем файлы из текущей рабочей директории
    if (this.settings.apiCwd) app.use("/cwd", express.static(this.settings.apiCwd));

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
    this.communication.outcoming.on("outcomingEvent", (event: { name: string; payload: unknown }) => {
      this.outcomingEventLog(event);
      socketIoServer.emit(event.name, event.payload);
    });

    server.listen(apiSettings.port, apiSettings.host, () => {
      const protocol = this.settings.tlsCert ? "https" : "http";
      const address = `${protocol}://${this.settings.auth.token}@${apiSettings.host}:${apiSettings.port}`;
      this.outcomingEventLog({
        name: "server",
        payload: {
          address,
        },
      });
    });
  }

  private outcomingEventLog({ name, payload }: { name: string; payload: any }) {
    function short(value: unknown, length: number = 8) {
      switch (typeof value) {
        case "bigint":
        case "boolean":
        case "number":
        case "undefined":
          return value;

        case "symbol":
          return value.toString();

        default:
          return (value + "").slice(0, length);
      }
    }

    const logObject = (() => {
      switch (name) {
        case eventNames.data:
          return { key: payload.key, value: short(payload.value) };
        case eventNames.inboundSignal:
        case eventNames.outboundSignal:
          return { ...payload, nodeGuid: short(payload.nodeGuid), data: short(payload.data) };
        case eventNames.networkState:
          return {};
        default:
          return payload;
      }
    })();

    const logString = JSON.stringify(logObject);

    if (this.settings.log) console.log(name, logString);
  }
}
