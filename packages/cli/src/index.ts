#!/usr/bin/env node
import child_process from "child_process";
import fs from "fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import os from "os";
import { pathToFileURL } from "url";

async function main() {
  console.log(`starting app`);
  const args = process.argv;

  const appUri = (args[2] || "").trim();
  const isDev = args[3] !== undefined;

  //#region LoadingAppJson
  const appJsonContent = await (async () => {
    try {
      return appUri.startsWith("http:") || appUri.startsWith("https:")
        ? fetch(appUri).then((x) => x.text())
        : fs.promises.readFile(appUri, "utf8");
    } catch (error) {
      console.error(`failed to load app: ${appUri}`);
      throw error;
    }
  })();

  const appJson = JSON.parse(appJsonContent);
  const packageJson = appJson["package.json"];
  //#endregion

  if(isDev){
  //#region DevRun
  const { Runtime } = await import("@d3s/runtime");
  const runtime = new Runtime("node");
  await runtime.init(appJson);
  //#endregion
  }
  else {
  //#region ProductionRun
  let lastExecSyncResult = "";

  // make d3s root folder
  const d3sRootDir = path.join(os.tmpdir(), "d3s");
  fs.mkdirSync(d3sRootDir, { recursive: true });

  lastExecSyncResult = child_process
    .execSync(`npm init --yes`, { cwd: d3sRootDir, stdio: "inherit" })
    ?.toString("utf8");

  const appGuid = crypto.randomUUID(); // fs.mkdtempSync("app-");
  const appWorkspace = `apps/${appGuid}`;
  lastExecSyncResult = child_process
    .execSync(`npm init --yes -w ${appWorkspace}`, { cwd: d3sRootDir, stdio: "inherit" })
    ?.toString("utf8");

  // заменяем package.json файл из скаченного app.json и делаем "npm i"
  const updatedPackageJson = {
    ...packageJson,
    private: true,
    name: `${packageJson.name}-${appGuid}`,
    originalName: packageJson.name,
  };
  console.log(`updatedPackageJson:\n${JSON.stringify(updatedPackageJson)}`);
  fs.writeFileSync(path.join(d3sRootDir, appWorkspace, "package.json"), JSON.stringify(updatedPackageJson));
  lastExecSyncResult = child_process
    .execSync(`npm i -w ${appWorkspace}`, { cwd: d3sRootDir, stdio: "inherit" })
    ?.toString("utf8");

  // проверить на что если версия будет отличаться здесь должен подтянуть локальную версию из node_modules самомго аппа а не родительской общей папки
  const runtimeModulePath = pathToFileURL(createRequire(path.join(d3sRootDir, appWorkspace, "fake-entrypoint-index.js")).resolve("@d3s/runtime")).toString();
  const { Runtime } = await import(runtimeModulePath);

  const runtime = new Runtime("node");
  await runtime.init(appJson);
  //#endregion
  
  }
}

main();