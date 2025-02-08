#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "node:module";
import { run, RunOptions } from "./command/run.js";
import * as cast from "./service/cast.js";

// добавить параметры запуска
// npx @d3s/cli info https://...
// npx @d3s/cli designer

const program = new Command();

const require = createRequire(import.meta.url);
const packageVersion = require("@d3s/cli/package.json").version;

program.name("d3s").description("A self-sufficient runtime for softainers").version(packageVersion);

program
  .command("run")
  .description("run app")

  // .argument("<source>", "app source: local fs ./path/app.json or remote http://example.com/app.json")
  .arguments("<source>")

  // cli client options
  .option("--develop", "develop mode. no npm package installations", false)
  .option("--dry-run", "don't run app, just print run details", false)

  // host options
  // .option("-s, --save [string]", "save changed app state to file", false)
  .option("-r, --readonly", "readonly app don't change app.json file", false)
  .option("-p, --port <number>", "api port", (value) => {
    const port = cast.toNumber(value);
    if (port === undefined) throw new Error(`invalid port: ${value}`);
    return port;
  })
  .option("-h, --host <string>", "api host")
  .option("--apiCwd", "enables serving of current working directory via api, eg: host:port/cwd - will be available")
  .option("--tlsCert", "path to tls certificate file. it enables https on api")
  .option(
    "--auth [string]",
    "enables basic auth on web api [optionally provide token or newly generated uuid will be used]",
    false
  )
  .option("--log [string]", "enables logging to stdout [optionally to file]", false)
  .option("-s, --signal <string...>", "signal aka global variables")

  // app options
  .option(
    "--serviceAiEndpoint <string>",
    "base url to chat completions endpoint of chat-gpt like service: deepseek, gigachat, etc...",
    "https://api.deepseek.com/chat/completions"
  )
  .option("--serviceAiToken <string>", "auth token for ai service")

  .action((source, options, command) => {
    const verbose = options.dryRun === true || options.log !== false;
    const runSettings: RunOptions = {
      source: source,
      develop: options.develop,
      dryRun: options.dryRun,
      verbose: verbose,
      app: {
        service: {
          ai: {
            endpoint: options.serviceAiEndpoint,
            token: options.serviceAiToken,
          },
        },
        signals: options.signal,
      },
      host: {
        type: "node",
        source: source,
        readonly: options.readonly,
        api: getApi(options.port, options.host),
        apiCwd: options.apiCwd,
        tlsCert: options.tlsCert,
        auth: {
          enabled: options.auth !== false,
          token: typeof options.auth === "string" ? options.auth : crypto.randomUUID(),
        },
        log: options.log,
      },
    };

    run(runSettings);
  });

program.parse();

function getApi(port: number | undefined, host: string | undefined): RunOptions["host"]["api"] {
  return port === undefined && host === undefined
    ? undefined
    : {
        port: port || 5000,
        host: host || "127.0.0.1",
      };
}
