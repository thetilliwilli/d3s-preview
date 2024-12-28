import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import path from "path";
import url from "url";
import { scannerSafeOperations } from "../domain/scanner-safe-operations.js";

export const preparePostmanCollection = new NodeBuilder()
  .withInput({
    inFile: "",
    outFile: "",
    run: null,
  })
  .withOutput({
    finished: null,
  })
  .withHandlers({
    run({ input, signal, emit }) {
      const stat = fs.statSync(input.inFile);
      const isDirectory = stat.isDirectory();

      if (isDirectory) fs.mkdirSync(input.inFile, { recursive: true });

      const collectionPaths = isDirectory
        ? fs
            // @ts-ignore typescript не корректно отображает сигнатуру readdirSync, отсуствует recursive:true
            .readdirSync(input.inFile, { recursive: true, withFileTypes: true })
            .filter((x: fs.Dirent) => x.isFile())
            // @ts-ignore typescript не корректно отображает сигнатуру fs.Dirent
            .map((x) => path.resolve(x.path, x.name))
        : [input.inFile];

      for (const collectionPath of collectionPaths) {
        const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));

        // modifications
        resolveVariables(collection);
        transformEachItemRecursive(collection, []);

        const outPath = isDirectory ? path.join(input.outFile, path.basename(collectionPath)) : input.outFile;
        fs.writeFileSync(outPath, JSON.stringify(collection));
      }

      emit("finished", null);
    },
  });

/**
 * todo: потенциально медленная реализация
 * @param collection postman collection type
 */
function resolveVariables(collection: any) {
  const variables = collection.variable;

  let itemString = JSON.stringify(collection.item);

  let marker_found = 1;

  while (marker_found > 0) {
    marker_found = 0;

    for (const variable of variables) {
      const marker = `{{${variable.key}}}`;

      if (itemString.indexOf(marker) == -1) continue;
      else {
        marker_found += 1;
        itemString = itemString.replaceAll(marker, variable.value);
      }
    }
  }

  collection.item = JSON.parse(itemString);
}

const defaultBody = JSON.stringify({ meta: {}, data: {} });

function transformHost(host: string) {
  const parsedUrl = url.parse(host);

  parsedUrl.protocol = "{{scheme}}:";
  parsedUrl.host = "{{host}}";
  parsedUrl.port = null;
  parsedUrl.slashes = true;

  // вставляем переменные
  let result = url.format(parsedUrl);

  // удаляем слеш если он есть в конце строки, чтобы не было удвоения в итоговом урле, когда откроется в постмане
  if (result.slice(-1) === "/") result = result.slice(0, -1);

  return result;
}

/**
 *
 * @param item postman collection type
 */
function transformEachItemRecursive(item: any, items: any[]) {
  if (item.item) {
    const reversedItems = item.item.slice().reverse();
    for (const eachItem of reversedItems) {
      transformEachItemRecursive(eachItem, item.item);
    }
  }

  // удаляем свойство responses с ответами сервера, чтобы не создавать example сущностей в постмане
  if (item.response) item.response = [];

  if (item.request) {
    const request = item.request;

    // если операция не входит в whitelist "безопасных" операций то мы удаляем такой запрос из коллекции
    const operation = request.url.path.length === 0 ? "" : request.url.path.slice(-1)[0].trim();
    if (scannerSafeOperations.indexOf(operation) === -1) {
      const collectionIndex = items.findIndex((x) => x === item);
      items.splice(collectionIndex, 1);
      return;
    }

    // заменяем все хосты на специальный маркер {{host}} чтобы можно было подставлять удобно переменную в постмане
    request.url.host = request.url.host.map((x: string) => transformHost(x));

    // удаляем авторизацию
    if (request.auth) delete request.auth;

    // заменяем все body в POST запросах на стандартные {meta:{},data:{}}
    if (request.method.toLowerCase() === "post" && request.body) if (request.body.raw) request.body.raw = defaultBody;
  }
}
