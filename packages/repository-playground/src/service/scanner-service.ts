import fs from "fs";
import newman from "newman";
import path from "path";
import { SocksProxyAgent } from "socks-proxy-agent";
import util from "util";
import { Endpoint } from "../domain/endpoint.js";
import { endpointService } from "./endpoint-service.js";
import { EndpointScanResult } from "../domain/endpoint-scan-result.js";

export type TruncationLimits = {
  headersSize: number;
  bodySize: number;
};

export type ProxySettings = {
  host: number;
  port: number;
};

function slugDate(date: Date | number): string {
  return new Date(date).toISOString().replaceAll(":", "-").split(".").slice(0, -1).join(".");
}

class ScannerService {
  private reportsPipe = "reports";

  public scan({
    endpoints,
    scanName,
    testScript,
    summaryScript,
    headersSize,
    bodySize,
    proxyHost,
    proxyPort,
    emit,
  }: {
    endpoints: Endpoint[];
    scanName: string;
    testScript: string;
    summaryScript: string;
    headersSize: number;
    bodySize: number;
    proxyHost: string;
    proxyPort: number;
    emit: (name: any, data: any) => void;
  }) {
    const collection = this.toPostmanCollection(endpoints, scanName, testScript);

    const callback = (error: any, postmanSummary: newman.NewmanRunSummary) => {
      if (error) {
        emit("error", util.inspect(error));
      }

      const fullScanName = `${scanName}-${slugDate(Date.now())}`;
      const outputPipe = endpointService.getPipe(`${this.reportsPipe}/${fullScanName}`);
      const allScansPipe = path.dirname(outputPipe);
      fs.mkdirSync(allScansPipe, { recursive: true });

      const result = this.toScanResult(postmanSummary, { bodySize, headersSize });
      fs.writeFileSync(outputPipe, JSON.stringify(result));

      emit("report", outputPipe);
      emit("reports", endpointService.getPipes(allScansPipe));
      emit("summary", this.getSummary(postmanSummary, fullScanName, summaryScript, outputPipe));
      emit("done", null);
    };

    const requestAgent =
      proxyHost.trim() !== "" ? new SocksProxyAgent(`socks4://${proxyHost}:${proxyPort}`) : undefined;

    newman
      .run(
        {
          collection: collection,
          insecure: true,
          requestAgents: {
            http: requestAgent,
            https: requestAgent,
          },
        },
        callback
      )
      .on("item", (error, item) => {
        emit("progress", this.getProgress(item));
      });
  }

  public updateReports() {
    return endpointService.getPipes(endpointService.getPipe(this.reportsPipe));
  }

  private getProgress(item: any) {
    const itemIndex = item.cursor.position + 1;
    const itemsCount = item.cursor.length;
    return `${((itemIndex / itemsCount) * 100).toFixed(1)}% (${itemIndex}/${itemsCount}) ${item.item.name}`;
  }

  private getSummary(postmanSummary: newman.NewmanRunSummary, scanName: string, summaryScript: string, report: string) {
    const durationMs = (postmanSummary.run.timings.completed || 0) - (postmanSummary.run.timings.started || 0);
    const hours = Math.floor(durationMs / 1000 / 60 / 60);
    const minutes = Math.floor(durationMs / 1000 / 60) - hours * 60;
    const seconds = Math.floor(durationMs / 1000) - hours * 60 * 60 - minutes * 60;
    const context = {
      scanName,
      duration: `${hours}h${minutes}m${seconds}s`,
      endpoints: postmanSummary.run.stats.items.total || 0,
      assertions: postmanSummary.run.stats.assertions.failed || 0,
      report,
    };
    const summary = (() => {
      try {
        const functionBody =
          summaryScript.trim()[0] === "`" ? `return ${summaryScript}` : `return \`${summaryScript}\``;
        return new Function("summary", functionBody)(context);
      } catch (e) {
        return `Результат сканирования ${scanName}: не удалось сгенерировать summary: ${e + ""}`;
      }
    })();
    return summary;
  }

  private toPostmanCollection(endpoints: Endpoint[], collectionName: string, testScript: string) {
    return {
      info: {
        _postman_id: crypto.randomUUID(),
        name: collectionName,
        schema: "https://schema.getpostman.com/json/collection/v2.0.0/collection.json",
      },
      item: endpoints.map(this.toCollectionItem),
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: testScript.split("\n"),
          },
        },
      ],
    };
  }

  private toCollectionItem(endpoint: Endpoint) {
    const header = Object.entries(endpoint.headers).map(([key, value]) => ({ key, value }));
    const body =
      endpoint.body === null
        ? null
        : {
            mode: "raw",
            raw: typeof endpoint.body === "string" ? endpoint.body : JSON.stringify(endpoint.body),
          };

    return {
      name: endpoint.name,
      request: {
        method: endpoint.method,
        url: endpoint.url,
        header: header,
        body: body,
      },
    };
  }

  private toScanResult(summary: newman.NewmanRunSummary, limits: TruncationLimits) {
    const report = summary.run.executions
      .filter((x) => x.assertions && x.assertions.length > 0 && x.assertions[0].error !== undefined)
      .map((x) => this.toEndpointScanResult(x, limits));

    return report;
  }

  private getExecutionError(execution: newman.NewmanRunExecution): string {
    if ("requestError" in execution) {
      return util.inspect(execution.requestError).split("\n")[0].trim();
    }

    return "UndefinedError";
  }

  private toEndpointScanResult(execution: newman.NewmanRunExecution, limits: TruncationLimits): EndpointScanResult {
    const response = execution.response;

    if (!response) {
      const noResponse = "<NoResponse>";
      const error = this.getExecutionError(execution);

      return {
        guid: crypto.randomUUID(),
        method: execution.request.method,
        path: execution.request.url.getPath(),
        protocol: execution.request.url.protocol || "",
        host: execution.request.url.getHost(),
        port: execution.request.url.port || "",
        type: noResponse,
        code: 0,
        status: noResponse,
        size: 0,
        time: 0,
        headers: noResponse,
        body: noResponse,
        error,
        risk: false,
        riskRequest: "",
        riskResponse: "",
        riskNote: "",
        diff: "",
        diffs: [],
      };
    }

    const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();

    const originalHeaders = response.headers.toString();
    const headers = originalHeaders.slice(0, limits.headersSize);

    const originalBody = (response.stream || "").toString();
    const body = originalBody.slice(0, limits.bodySize);

    const headersTruncated = headers.length !== originalHeaders.length;
    const bodyTruncated = body.length !== originalBody.length;
    const url = execution.request.url.toString();

    return {
      guid: crypto.randomUUID(),
      method: execution.request.method,
      protocol: execution.request.url.protocol || "",
      host: execution.request.url.getHost(),
      port: execution.request.url.port || "",
      path: execution.request.url.getPath(),
      type,
      code: response.code,
      status: response.status,
      size: response.responseSize || 0,
      time: response.responseTime,
      headers,
      body,
      error: "",
      risk: false,
      riskRequest: "",
      riskResponse: "",
      riskNote: "",
      diff: "",
      diffs: [],
    };
  }
}

export const scannerService = new ScannerService();
