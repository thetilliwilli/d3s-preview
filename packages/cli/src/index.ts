#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "node:module";
import { run, RunOptions } from "./command/run.js";

// добавить параметры запуска
// npx @d3s/cli info https://...
// npx @d3s/cli designer

const program = new Command();

const require = createRequire(import.meta.url);
const packageVersion = require("@d3s/cli/package.json");

program.name("d3s").description("A self-sufficient runtime for softainers").version(packageVersion);

program
  .command("run")
  .description("run app")

  .argument("<source>", "app source: local fs ./path/app.json or remote http://example.com/app.json")

  // cli client options
  .option("--develop", "develop mode. no npm package installations", false)
  .option("--dry-run", "don't run app, just print run details")

  // host options
  .option("-s, --save [string]", "save changed app state to file", false)
  .option(
    "--api [string]",
    "enables api [optionally bind address scheme://host:port (ex: https://127.0.0.1:5000)]",
    false
  )
  .option("--apiCwd", "enables serving of current working directory via api, eg: host:port/cwd - will be available")
  .option("--tlsCert", "path to tls certificate file. it enables https on api")
  .option(
    "--auth [string]",
    "enables basic auth on web api [optionally provide token or newly generated uuid will be used]",
    false
  )
  .option("--log [string]", "enables logging to stdout [optionally to file]", false)

  // app options
  .option(
    "--serviceAiEndpoint <string>",
    "base url to chat completions endpoint of chat-gpt like service: deepseek, gigachat, etc...",
    "https://api.deepseek.com/chat/completions"
  )
  .option("--serviceAiToken <string>", "auth token for ai service")

  .action((source, options, command) => {
    // const options = { ...process.env, ...cliOptions };

    const runSettings: RunOptions = {
      source: source,
      develop: options.develop,
      dryRun: options.dryRun,
      app: {
        service: {
          ai: {
            endpoint: options.serviceAiEndpoint,
            token: options.serviceAiToken,
          },
        },
      },
      host: {
        type: "node",
        save: options.save === true ? "app.json" : options.save,
        api: getApi(options.api),
        apiCwd: options.apiCwd,
        tlsCert: options.tlsCert,
        auth: options.auth === true ? crypto.randomUUID() : options.auth,
        log: options.log,
      },
    };

    run(runSettings);
  });

program.parse();

function getApi(apiOption: boolean | string): RunOptions["host"]["api"] {
  if (apiOption === false) return undefined;

  const apiOrDefault = apiOption === true ? "http://127.0.0.1:5000" : apiOption;

  try {
    const url = /^.+:\/\//.exec(apiOrDefault) ? new URL(apiOrDefault) : new URL(`http://${apiOrDefault}`);

    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new Error(`invalid api: ${apiOption}. should be in format: [http|https]://hostname:port`);

    return {
      protocol: url.protocol as "http:" | "https:",
      hostname: url.hostname,
      port: url.port === "" ? 5000 : Number.parseInt(url.port),
    };
  } catch (error) {
    console.error(`invalid api: ${apiOption}. should be in format: protocol://hostname:port`);
    // throw new Error(`invalid api: ${apiOption}. should be in format: protocol://hostname:port`);
    process.exit(1);
  }

  // // const defaultResult = {
  // //   protocol: "http:" as const,
  // //   hostname: "127.0.0.1",
  // //   port: 5000,
  // // };
  // const apiOrDefault = apiOption === true ? "http://127.0.0.1:5000" : apiOption;
  // const matchGroups = apiOrDefault.match(/^(?:(?<protocol>\w+):\/\/)?(?<hostname>[^:\/]+)(?::(?<port>\d+))?/)?.groups;

  // if (matchGroups === undefined)
  //   throw new Error(`invalid api: ${apiOption}. should be in format: protocol://hostname:port`);

  // /*  || (matchGroups.port !== undefined && Number.isNaN(Number.parseInt(matchGroups.port))) */

  // const matchGroupsDefined = {
  //   protocol: <"http:" | "https:"> (matchGroups.protocol === undefined ? "http:" : matchGroups.protocol),
  //   hostname: matchGroups.hostname === undefined ? "127.0.0.1" : matchGroups.hostname,
  //   port: matchGroups.port === undefined ? 5000 : matchGroups.port,
  // };

  // return {
  //   protocol: matchGroups.protocol || "http:",
  //   hostname: matchGroups.hostname || "127.0.0.1",
  //   port: matchGroups.port === undefined ? 5000 : Number.parseInt(matchGroups.port),
  // };

  // const result =
  //   matchGroups === undefined
  //     ? defaultResult
  //     : {
  //         ...defaultResult,
  //         ...{
  //           protocol: matchGroups.protocol as "http:" | "https:",
  //           hostname: matchGroups.hostname,
  //           port: Number.isNaN(Number.parseInt(matchGroups.port)) ? 5000 : Number.parseInt(matchGroups.port),
  //         },
  //       };

  // return result;

  // const hasProtocol = apiOrDefault.startsWith("http://") || apiOrDefault.startsWith("https://");

  // const urlParts = apiOrDefault.split(":");

  // if(urlParts.length > 1){
  //   if(hasProtocol){
  //     return {
  //       protocol: urlParts[0].startsWith("https://") ? "https:" : "http:",
  //       hostname: urlParts
  //     };

  //   }
  // }
  // if(hasProtocol && urlParts.length)
}
