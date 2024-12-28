import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import path from "path";
import util from "util";
import { EndpointScanResult } from "../domain/endpoint-scan-result.js";
import { endpointService } from "../service/endpoint-service.js";

export const reportDiff = new NodeBuilder()
  .withInput({
    report1: "",
    report2: "",
    includeSame: false,
    run: null,
  })
  .withOutput({
    error: "",
    output: "",
    done: null,
  })
  .withHandlers({
    async run({ input, emit }) {
      const reportsPipe = "reports";
      const comparePath = [input.report1, input.report2].map((x) => path.basename(x)).join("-vs-");
      const outputPipe = endpointService.getPipe(`${reportsPipe}/${comparePath}`);
      try {
        const results1 = JSON.parse(fs.readFileSync(input.report1, "utf8"));
        const results2 = JSON.parse(fs.readFileSync(input.report2, "utf8"));

        const diffReport = getDiffReport(results1, results2, input.includeSame);

        fs.writeFileSync(outputPipe, JSON.stringify(diffReport));

        emit("output", outputPipe);
        emit("done", null);
      } catch (error) {
        emit("error", util.inspect(error));
      }
    },
  });

const keys: (keyof EndpointScanResult)[] = ["protocol", "port", "host", "path", "method"];

const diffAttributes: (keyof EndpointScanResult)[] = ["status", "type", "size", "body"];

function getKey(endpoint: EndpointScanResult) {
  return keys.map((key) => endpoint[key]).join("-");
}

function getDiffs(endpoint1: EndpointScanResult, endpoint2: EndpointScanResult) {
  return diffAttributes
    .filter((attr) => endpoint1[attr] !== endpoint2[attr])
    .map((attr) => ({ attr, prev: endpoint1[attr] + "", next: endpoint2[attr] + "" }));
}

function getDiffReport(
  results1: EndpointScanResult[],
  results2: EndpointScanResult[],
  includeSame: boolean
): EndpointScanResult[] {
  const items1 = results1.map((x) => ({
    endpoint: x,
    key: getKey(x),
  }));

  const items2 = results2.map((x) => ({
    endpoint: x,
    key: getKey(x),
  }));

  const diffReport = items2
    .map((item2) => {
      const endpoint = item2.endpoint;

      const item1 = items1.find((x) => x.key === item2.key);

      const isNew = item1 === undefined;
      endpoint.diffs = isNew ? [] : getDiffs(item1.endpoint, item2.endpoint);
      endpoint.diff = isNew ? "new" : endpoint.diffs.length > 0 ? "changed" : "same";

      return endpoint;
    })
    .filter((x) => includeSame || x.diff !== "same");

  return diffReport;
}
