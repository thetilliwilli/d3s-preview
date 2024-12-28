import { NodeBuilder } from "@d3s/runtime";
import { run } from "newman";
import fs from "fs";

export const newman = new NodeBuilder()
  .withInput({
    collection: "",
    delayRequest: 0,
    scheme: "",
    host: "",
    useExternalUrl: true,
    report: "report.html",
    run: null,
  })
  .withOutput({
    error: "",
    assertionsCount: 0,
    assertions: [] as any[],
    asserted: null,
    finished: null,
  })
  .withHandlers({
    run({ input, signal, emit }) {
      const collection = JSON.parse(fs.readFileSync(input.collection, "utf8"));
      const testScriptContent = fs.readFileSync("scanner-tests-script.js", "utf8");

      const apiListsJson = fs.readFileSync("mitest_urls.json", "utf8");
      const lisToReplace = JSON.parse(apiListsJson).map((x: any) => [x.url.internal, x.url.external]);
      const prerequestScriptContent = fs
        .readFileSync("scanner-prerequest-script.js", "utf8")
        .replace("[/*REPLACE_MARKER*/]", JSON.stringify(lisToReplace));

      collection.event = [
        {
          listen: "prerequest",
          script: {
            type: "text/javascript",
            exec: prerequestScriptContent.split("\n"),
          },
        },
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: testScriptContent.split("\n"),
          },
        },
      ];

      run(
        {
          collection: collection,
          reporters: "htmlextra",
          insecure: true,
          delayRequest: input.delayRequest,
          reporter: {
            htmlextra: {
              export: input.report,
              showOnlyFails: true,
              omitRequestBodies: true,
            },
          },
          envVar: [
            { key: "scheme", value: input.scheme },
            { key: "host", value: input.host },
            { key: "useExternalUrl", value: input.useExternalUrl ? "yes" : "no" },
          ],
        },
        function (err, summary) {
          if (err) {
            emit("error", err.message);
          }
          const assertions = summary.run.executions
            .filter((x) => x.assertions[0].error)
            .map((x) => ({
              error: { message: x.assertions[0].error.message, test: x.assertions[0].error.test },
              name: x.item.name,
              url: x.request.url.toString(),
            }));

          emit("assertionsCount", assertions.length);
          emit("assertions", assertions);

          if (assertions.length > 0) emit("asserted", null);

          emit("finished", null);
        }
      );
    },
  });
