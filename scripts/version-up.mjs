#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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
const packageFiles = JSON.parse(execSync(`npm query .workspace`).toString("utf8")).map(x => ({
    version: x.version,
    path: path.join(x.path, "package.json"),
}));

// console.log(files);

// process.exit();

//checking all versions are the same
// const areAllSameVersion = new Set(packages.map(x => x.version)).size === 1;

const previousVersions = [...new Set(packageFiles.map(x => x.version))];
if (previousVersions.length > 1)
    console.warn(`Warning not all packages have the same previous version`);
console.log(`previousVersions: ${JSON.stringify(previousVersions)}`);
// if(previousVersions.length === 1)
//     console.log()
// if(new Set(packages.map(x=>x.version)).size === 1){
//     console.log(`All packages have the same version = ${packages[0].version}. next version will be `);
// }
// else{
//     throw Error(`not all pacakges have the same version. specify concrete version manually`);
// }


// console.log(`package ${files[0]} has version = ${JSON.parse(fs.readFileSync(files[0], "utf8")).version}`);

// const version = process.argv[2];
// if (version === undefined && areAllSameVersion === false) {
//     console.log(`version is not specified: ${version} and not all packages have the same version. specify concrete version manually`);
//     console.log(`here is packages details:\n${JSON.stringify(packages)}`);
//     process.exit(1);
// }

// const nextVersion = version || packages[0].version.split(".").map((x, i) => i === 2 ? (Number.parseInt(x) + 1) + "" : x).join(".")
const nextVersion = packageFiles[0].version.split(".").map((x, i) => i === 2 ? (Number.parseInt(x) + 1) + "" : x).join(".");

console.log(`setting new version: ${nextVersion}`);
console.log(`...`);

packageFiles.forEach(packageFile => {
    const json = JSON.parse(fs.readFileSync(packageFile.path, "utf8"));

    json.version = nextVersion;

    if (json.dependencies)
        Object.keys(json.dependencies)
            .filter(key => key.slice(0, 5) === "@d3s/")
            .forEach(key => {
                json.dependencies[key] = nextVersion;
            });

    fs.writeFileSync(packageFile.path, JSON.stringify(json, null, " "));
});

console.log(`new version applied`);
