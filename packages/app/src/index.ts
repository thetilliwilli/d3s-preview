#!/usr/bin/env node
import child_process from "child_process";
import fs from "fs";
import os from "os";
// import { createRequire } from "node:module";
import path from "node:path";

const entrypointCode = `import child_process from "child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const resolvedEntry = require.resolve("@d3s/runtime-host-node");
child_process.fork("@d3s/runtime-host-node", { env: process.env });`;

async function main() {
  const args = process.argv;

  const appUri = (args[2] || "").trim();

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

  //#region A
  // make d3s root folder
  const d3sRootDir = path.join(os.tmpdir(), "d3s");
  fs.mkdirSync(d3sRootDir, { recursive: true });

  // необходимо создать директорию
  // чтобы d3sRootDir стал базовой директорией при "npm i"
  // иначе пойдёт выше искать. например на windows попадёт в "C:\Users\<UserName>\node_modules"
  // потому что os.tmpdir() находиться в "C:\Users\<UserName>\AppData\Local\Temp"
  const d3sNodeModulesDir = path.join(d3sRootDir, "node_modules");
  fs.mkdirSync(d3sNodeModulesDir, { recursive: true });

  
  // install runtime
  const d3sRuntimeDir = path.join(d3sRootDir, "node_modules/@d3s/runtime-host-node");
  const runtimeExists = fs.existsSync(d3sRuntimeDir);
  let lastExecSyncResult = "";
  if (!runtimeExists) {
    lastExecSyncResult = child_process
      .execSync(`npm i @d3s/runtime-host-node`, { cwd: d3sRootDir, stdio: "inherit" })
      ?.toString("utf8");
  }

  // make root folder
  const appRootDir = path.join(d3sRootDir, fs.mkdtempSync("app-"));
  const appPackageJsonPath = path.join(appRootDir, "package.json");
  const appEntrypointPath = path.join(appRootDir, "entrypoint.mjs");
  const appAppJsonPath = path.join(appRootDir, "app.json");

  fs.mkdirSync(appRootDir, { recursive: true });

  // install app deps
  fs.writeFileSync(appPackageJsonPath, JSON.stringify(packageJson));
  lastExecSyncResult = child_process.execSync(`npm i`, { cwd: appRootDir })?.toString("utf8");

  // creating entrypoint
  fs.writeFileSync(appEntrypointPath, entrypointCode);

  // copying app.json
  fs.writeFileSync(appAppJsonPath, appJsonContent);
  child_process.fork(appEntrypointPath, { env: process.env });
  //#endregion A

  // fs.writeFileSync("app.json", appJsonContent);

  // const require = createRequire(import.meta.url);
  // const resolvedEntry = require.resolve("@d3s/runtime-host-node");

  // child_process.fork(resolvedEntry, { env: process.env });
}

function createFsWorkingStructureForApp(appJson: any) {
  // make d3s root folder
  const d3sRootDir = path.join(os.tmpdir(), "d3s");
  fs.mkdirSync(d3sRootDir, { recursive: true });
  const d3sRuntimeDir = path.join(d3sRootDir, "node_modules/@d3s/runtime-host-node");

  // install runtime
  const runtimeExists = fs.existsSync(d3sRuntimeDir);
  if (!runtimeExists) {
    const result = child_process.execSync(`npm i @d3s/runtime-host-node`, { cwd: d3sRootDir }).toString("utf8");
  }

  // make root folder
  const appRootDir = path.join(d3sRootDir, fs.mkdtempSync("app-"));
  fs.mkdirSync(appRootDir, { recursive: true });

  // install app deps
  fs.writeFileSync("package.json", JSON.stringify(appJson["package.json"]));
  const depsInstallingResult = child_process.execSync(`npm i`, { cwd: appRootDir }).toString("utf8");

  // creating entrypoint
  fs.writeFileSync("entrypoint.js", JSON.stringify(appJson["package.json"]));

  // copying app.json
}

main();
