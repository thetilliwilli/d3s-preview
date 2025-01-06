#!/usr/bin/env node
import child_process from "child_process";
import fs from "fs";
import path from "path";

async function main() {
  const args = process.argv;

  const appFile = (args[2] || "").trim();

  const fullUrl =
    appFile.startsWith("file:") || appFile.startsWith("http:") || appFile.startsWith("https:")
      ? appFile
      : `file:${appFile}`;

  const response = await fetch(fullUrl);

  if (!response.ok) throw new Error(`failed to fetch app url: ${fullUrl}`);

  const fileContent = await response.text();

  fs.writeFileSync("app.json", fileContent);

  const resolvedEntry = path.resolve("@d3s/runtime-host-node");

  console.log(`resolvedEntry: ${resolvedEntry}`);

  child_process.fork(resolvedEntry, { env: process.env });
}

main();
