import { execSync } from "child_process";

const workspaces = JSON.parse(execSync("npm query .workspace").toString("utf8")).map(x => `-w ${x.name}`).join(" ");
const command = `npm publish --access public ${workspaces}`

console.log(command);

execSync(command, { stdio: "inherit" });