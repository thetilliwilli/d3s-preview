import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import path from "path";
import { SocksProxyAgent } from "socks-proxy-agent";
import { NewmanService } from "../service/newman-service.js";

export const apiScanner = new NodeBuilder()
  .withInput({
    collection: "",
    delayRequest: 0,
    varsFile: "vars.json",
    reportDir: "reports/",
    skip: 0,
    take: -1,
    proxyHost: "",
    proxyPort: "",
    reponseSizeLimit: 1000,
    noCacheDir: true,
    showOnlyFails: true,
    prerequestScript: "",
    testScript: "",
    mitestUrls: "",
    run: null,
  })
  .withOutput({
    error: "",
    assertionsCount: 0,
    collectionFinished: null,
    scanFinished: null,
    progressInfo: {
      percents: "0%",
      collection: "",
      host: "",
      summary: "",
    } as ReturnType<NewmanService["getProgressInfo"]>,
    progressSummary: "",
    scanSummary: "",
  })
  .withHandlers({
    async run({ input, emit }) {
      const scanRunName = new Date()
        .toISOString()
        .split(".")[0]
        .replace(/[-:.Z]/g, "")
        .replace(/[T]/g, "-");
      const reportDirCache = path.posix.join(input.reportDir, scanRunName, "cache");
      const reportDirAsserted = path.posix.join(input.reportDir, scanRunName, "asserted");
      const reportDirJson = path.posix.join(input.reportDir, scanRunName, "json");

      [input.reportDir, reportDirCache, reportDirAsserted, reportDirJson].forEach((dirName) =>
        fs.mkdirSync(dirName, { recursive: true })
      );

      const apiListsJson = fs.readFileSync(input.mitestUrls, "utf8");
      const lisToReplace = JSON.parse(apiListsJson).map((x: any) => [x.url.internal, x.url.external]);
      let prerequestScript = fs
        .readFileSync(input.prerequestScript, "utf8")
        .replace("[/*REPLACE_MARKER*/]", JSON.stringify(lisToReplace));

      const testScript = fs.readFileSync(input.testScript, "utf8");

      const collectionBasePath = path.resolve(input.collection);
      const stat = await fs.promises.stat(collectionBasePath);

      const collectionPaths = stat.isDirectory()
        ? fs
            // @ts-ignore typescript не корректно отображает сигнатуру readdirSync, отсуствует recursive:true
            .readdirSync(collectionBasePath, { recursive: true, withFileTypes: true })
            .filter((x: fs.Dirent) => x.isFile())
            // @ts-ignore typescript не корректно отображает сигнатуру fs.Dirent
            .map((x) => path.resolve(x.path, x.name))
        : [collectionBasePath];

      const varsArray = JSON.parse(fs.readFileSync(input.varsFile, "utf8")) as {
        scheme: string;
        host: string;
        useExternalUrl: string;
        excludeReason: string | undefined;
      }[];

      const newman = new NewmanService();

      let skippedCount = 0;
      let takenCount = 0;
      for (let i = 0; i < collectionPaths.length; ++i) {
        const collectionPath = collectionPaths[i];
        for (let j = 0; j < varsArray.length; ++j) {
          const cursorIndex = j + i * varsArray.length;
          const shouldSkip = skippedCount < input.skip;
          const shouldTake = input.take < 0 ? true : takenCount < input.take;
          const vars = varsArray[j];

          const shouldBeSkipped = shouldSkip || !shouldTake || vars.excludeReason !== undefined;

          const progressInfo = newman.getProgressInfo(i, collectionPaths, j, varsArray, shouldBeSkipped);
          emit("progressInfo", progressInfo);
          emit("progressSummary", progressInfo.summary);

          if (shouldBeSkipped) {
            skippedCount++;
            continue;
          }

          takenCount++;

          const envVar = Object.entries(vars).map(([key, value]) => ({ key, value: value + "" }));

          const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));

          const filename = path.basename(collectionPath, path.extname(collectionPath));
          const htmlextraExport = path.resolve(reportDirCache, `${filename}_${vars.host}.html`);

          const requestAgent =
            input.proxyHost !== "" && input.proxyPort !== ""
              ? new SocksProxyAgent(`socks4://${input.proxyHost}:${input.proxyPort}`)
              : undefined;

          const options = {
            collection,
            delayRequest: input.delayRequest,
            reporter: {
              htmlextra: {
                export: htmlextraExport,
                showOnlyFails: input.showOnlyFails,
              },
            },
            envVar: envVar,
            requestAgents: {
              http: requestAgent,
              https: requestAgent,
            },
          };

          const result = await newman.run(options, prerequestScript, testScript);

          // если были assertions тогда строим отчёт - старые вариант отчётов
          if (result.assertions.length > 0) {
            try {
              const assertedReport = path.posix.join(reportDirAsserted, path.basename(htmlextraExport));
              newman.filterAndModifyReport(htmlextraExport, assertedReport, input.reponseSizeLimit);
            } catch (e) {}
          }

          //new type of report 2.0 (aka raw json data + html dashboard w/ datagrid)
          // TODO!!!! тут забыл про то что у нас в вариациях участвуют еще и vars.scheme его тоже необходимо учесть в название файлов
          // иначе файлы начнут перезаписывать себя (версия с http и https перезапишет друг друга)
          const jsonReportFile = `${filename}_${vars.host}_scan-result.json`;
          const jsonReportFilePath = path.posix.join(reportDirJson, jsonReportFile);
          fs.writeFileSync(jsonReportFilePath, JSON.stringify(result.endpointScanResults));

          if (input.noCacheDir) fs.unlinkSync(htmlextraExport);

          if (result.error) emit("error", result.error);
        }

        emit("collectionFinished", null);
      }

      newman.makeReportHtml(input.reportDir);

      const scanSummary = `skipped ${skippedCount} scanned ${takenCount}`;
      emit("scanSummary", scanSummary);
      emit("scanFinished", null);
    },
  });
