#!/usr/bin/env node
import fs from "fs";
import path from "path";
import {execSync} from "child_process";

// const files = [
//     "packages/designer/package.json",
//     "packages/event/package.json",
//     "packages/repository-playground/package.json",
//     "packages/runtime/package.json",
//     "packages/state/package.json",
//     "packages/utils/package.json",
//     "packages/runtime-host-node/package.json",
//     "packages/cli/package.json",
// ];
// const files = execSync(`npx -c 'echo %cd%' -ws`)
const files = JSON.parse(execSync(`npm query .workspace`).toString("utf8")).map(x=>path.join(x.path, "package.json"));

// console.log(files);

// process.exit();

console.log(`package ${files[0]} has version = ${JSON.parse(fs.readFileSync(files[0], "utf8")).version}`);

const version = process.argv[2];
if (version === undefined) {
    console.log(`version is not specified: ${version}`);
    process.exit(1);
}

console.log(`setting new version: ${version}`);
console.log(`...`);

files.forEach(file => {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));

    json.version = version;

    if (json.dependencies)
        Object.keys(json.dependencies)
            .filter(key => key.slice(0, 5) === "@d3s/")
            .forEach(key => {
                json.dependencies[key] = version;
            });

    fs.writeFileSync(file, JSON.stringify(json, null, " "));
});

console.log(`new version applied`);
