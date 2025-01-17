import { AppSettings, Runtime } from "@d3s/runtime";
import { HostSettings, NodeHost } from "@d3s/runtime-host-node";
import { execSync } from "child_process";
import fs from "fs";
import crypto from "node:crypto";
import os from "os";
import path from "path";

function log(verbose: boolean, ...args: any) {
  if (verbose) console.log(...args);
}

export interface RunOptions {
  /** remote http://d3s/app.json or local ./app.json */
  source: string;
  develop: boolean;
  dryRun: boolean;
  verbose: boolean;
  app: AppSettings;
  host: HostSettings;
}

export async function run(ops: RunOptions) {
  if (ops.dryRun) {
    log(ops.verbose, JSON.stringify(ops, null, " "));
    return;
  }

  const appJson = await loadAppJson(ops.source);

  if (!ops.develop) {
    await setup(ops, appJson);
  }

  const host = new NodeHost(ops.host);
  const runtime = new Runtime(host, ops.app, appJson);
  await runtime.init();
}

async function setup(ops: RunOptions, appJson: any) {
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
