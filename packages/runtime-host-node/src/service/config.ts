import { withDefault } from "@d3s/utils";
import crypto from "crypto";
import { tmpdir } from "os";
import path from "path";
import url from "url";
import fs from "fs";

const toNumber = (x: unknown) => {
  const castedX = Number.parseInt(x + "");
  return Number.isFinite(castedX) ? castedX : undefined;
};
const toString = (x: unknown) => (typeof x === "string" ? x : undefined);
const toBoolean = (x: unknown) => (x === "true" ? true : x === "false" ? false : undefined);

const cwd = process.cwd();

try {
  Object.entries(JSON.parse(fs.readFileSync(".env.json", "utf8"))).forEach(([name, value]) => {
    process.env[name] = value as string | undefined;
  });
} catch (_) {}

const designerDist =
  process.env["DESIGNER_DIST"] === undefined ? undefined : path.resolve(process.env["DESIGNER_DIST"]);
const cert = process.env["CERT"] === undefined ? undefined : path.resolve(process.env["CERT"]);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
export const config = {
  port: withDefault(toNumber, process.env["PORT"], 5000),
  host: withDefault(toString, process.env["HOST"], "0.0.0.0"),
  cwd: cwd,
  appData: withDefault(toString, tmpdir(), tmpdir()),
  designerDist: withDefault(toString, designerDist, path.resolve(`${__dirname}/../../../designer/dist`)),
  webCwd: withDefault(toBoolean, process.env["WEB_CWD"], false),
  /** путь до файлов сертификата, но без указания расширений .crt и .key */
  cert: withDefault(toString, cert, "/etc/selfsigned"),
  tls: withDefault(toBoolean, process.env["TLS"], false),
  auth: withDefault(toBoolean, process.env["AUTH"], false),
  token: withDefault(toString, crypto.randomUUID(), crypto.randomUUID()),
  repo: withDefault(toString, process.env["REPO"], undefined),
  verbose: withDefault(toBoolean, process.env["VERBOSE"], true),
  appLocation: path.join(cwd, withDefault(toString, process.argv[2], "app.json")),
  aiEndpoint: withDefault(
    toString,
    process.env["AI_ENDPOINT"],
    "https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions"
  ),
  aiToken: withDefault(toString, process.env["AI_TOKEN"], ""),
};
