#!/usr/bin/env node
import child_process from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

async function main() {
  const args = process.argv;

  const appUri = (args[2] || "").trim();

  // console.log(`resolved app url: ${appUri}`);

  const fileContent = await (async () => {
    try {
      return appUri.startsWith("http:") || appUri.startsWith("https:")
        ? fetch(appUri).then((x) => x.text())
        : fs.promises.readFile(appUri, "utf8");
    } catch (error) {
      console.error(`failed to load app: ${appUri}`);
      throw error;
    }
  })();

  fs.writeFileSync("app.json", fileContent);

  const require = createRequire(import.meta.url);
  const resolvedEntry = require.resolve("@d3s/runtime-host-node");

  // console.log(`resolvedEntry: ${resolvedEntry}`);

  child_process.fork(resolvedEntry, { env: process.env });
}

main();
