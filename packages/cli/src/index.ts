#!/usr/bin/env node
import child_process from "child_process";
import fs from "fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import os from "os";
import { pathToFileURL } from "url";

async function main() {
  const args = process.argv;

  const appUri = (args[2] || "").trim();
  const isDev = args[3] !== undefined;

  //#region LoadingAppJson
  const isRemoteLocation = appUri.startsWith("http:") || appUri.startsWith("https:");
  const appJsonContent = await (async () => {
    try {
      return isRemoteLocation ? fetch(appUri).then((x) => x.text()) : fs.promises.readFile(appUri, "utf8");
    } catch (error) {
      console.error(`failed to load app: ${appUri}`);
      throw error;
    }
  })();

  const appJson = JSON.parse(appJsonContent);
  const packageJson = appJson["package.json"];
  //#endregion

  const appStateOutputPath =
    isRemoteLocation || appUri === ""
      ? "app.json" // будет сохраняться просто в текущей рабочей директории под дефолтным именем app.json
      : appUri; // в этом случае передан какой то вменяемый путь к файлу в локальный файловоый системе, поэтому используем его для сохранения имзенений

  if (isDev) {
    //#region DevRun
    const { Runtime } = await import("@d3s/runtime");
    const runtime = new Runtime(appJson, { appStateOutputPath });
    await runtime.init();
    //#endregion
  } else {
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
    const runtimeModulePath = pathToFileURL(
      createRequire(path.join(d3sRootDir, appWorkspace, "fake-entrypoint-index.js")).resolve("@d3s/runtime")
    ).toString();

    const { Runtime }: { Runtime: typeof import("@d3s/runtime").Runtime } = await import(runtimeModulePath);

    const runtime = new Runtime(appJson, { appStateOutputPath });
    await runtime.init();
    //#endregion
  }
}

main();
