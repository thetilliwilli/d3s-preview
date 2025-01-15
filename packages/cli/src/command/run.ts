import { execSync } from "child_process";
import fs from "fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";

function log(verbose: boolean, ...args: any) {
  if (verbose) console.log(...args);
}

export interface RunOptions {
  /** remote http://d3s/app.json or local ./app.json */
  source: string;
  develop: boolean;
  dryRun: boolean;
  verbose: boolean;
  app: import("@d3s/runtime").AppSettings;
  host: import("@d3s/runtime-host-node").HostSettings;
}

export async function run(ops: RunOptions) {
  if (ops.dryRun) {
    log(ops.verbose, JSON.stringify(ops, null, " "));
    return;
  }

  const appJson = await loadAppJson(ops.source);

  if (ops.develop) {
    //#region DevRun
    await runDev(ops, appJson);
    //#endregion
  } else {
    //#region Producation mode
    await runProd(ops, appJson);
    //#endregion
  }
}

async function runProd(ops: RunOptions, appJson: any) {
  const packageJson = appJson["package"];

  let lastExecSyncResult = "";

  // make d3s root folder
  const d3sRootDir = path.join(os.tmpdir(), "d3s");
  fs.mkdirSync(d3sRootDir, { recursive: true });

  lastExecSyncResult = execSync(`npm init --yes`, { cwd: d3sRootDir })?.toString("utf8");
  log(ops.verbose, lastExecSyncResult);

  const appGuid = crypto.randomUUID(); // fs.mkdtempSync("app-");
  const appWorkspace = `apps/${appGuid}`;
  lastExecSyncResult = execSync(`npm init --yes -w ${appWorkspace}`, { cwd: d3sRootDir })
    ?.toString("utf8");
  log(ops.verbose, lastExecSyncResult);

  // заменяем package.json файл из скаченного app.json и делаем "npm i"
  const updatedPackageJson = {
    ...packageJson,
    private: true,
    name: `${packageJson.name}-${appGuid}`,
    originalName: packageJson.name,
  };
  log(ops.verbose, `updatedPackageJson:\n${JSON.stringify(updatedPackageJson)}`);
  fs.writeFileSync(path.join(d3sRootDir, appWorkspace, "package.json"), JSON.stringify(updatedPackageJson));
  lastExecSyncResult = execSync(`npm i -w ${appWorkspace}`, { cwd: d3sRootDir })?.toString("utf8");
  log(ops.verbose, lastExecSyncResult);

  // проверить на что если версия будет отличаться здесь должен подтянуть локальную версию из node_modules самомго аппа а не родительской общей папки
  const runtimeModulePath = pathToFileURL(
    createRequire(path.join(d3sRootDir, appWorkspace, "fake-entrypoint-index.js")).resolve("@d3s/runtime")
  ).toString();

  const { Runtime }: { Runtime: typeof import("@d3s/runtime").Runtime } = await import(runtimeModulePath);

  const hostModulePath = pathToFileURL(
    createRequire(path.join(d3sRootDir, appWorkspace, "fake-entrypoint-index.js")).resolve("@d3s/runtime-host-node")
  ).toString();
  // log(hostModulePath);
  const { NodeHost }: { NodeHost: typeof import("@d3s/runtime-host-node").NodeHost } = await import(hostModulePath);
  // log(HostNode);

  const hostNode = new NodeHost(ops.host);
  const runtime = new Runtime(hostNode, ops.app, appJson);
  await runtime.init();
}

async function runDev(ops: RunOptions, appJson: any) {
  const { NodeHost } = await import("@d3s/runtime-host-node");
  const { Runtime } = await import("@d3s/runtime");
  const host = new NodeHost(ops.host);
  const runtime = new Runtime(host, ops.app, appJson);
  await runtime.init();
}

async function loadAppJson(source: string) {
  const remote = source.startsWith("http:") || source.startsWith("https:");

  const appJsonContent = await (async () => {
    try {
      return remote ? fetch(source).then((x) => x.text()) : fs.promises.readFile(source, "utf8");
    } catch (error) {
      console.error(`failed to load app: ${source}`);
      throw error;
    }
  })();

  const appJson = JSON.parse(appJsonContent);

  return appJson;
}
