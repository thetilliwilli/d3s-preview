import { NodeBuilder } from "@d3s/runtime";
import { endpointService } from "../service/endpoint-service.js";
import { scannerService } from "../service/scanner-service.js";

export const endpointScanner = new NodeBuilder()
  .withInput({
    pipe: "",
    scanName: "",
    testScript: "",
    summaryScript: "",
    headersSize: 1000,
    bodySize: 1000,
    proxyHost: "",
    proxyPort: 9050,
    run: null,
    updateReports: null,
  })
  .withOutput({
    progress: "",
    report: "",
    reports: [] as string[],
    summary: "",
    error: "",
    done: null,
  })
  .withHandlers({
    async run({ input, emit }) {
      const endpoints = endpointService.getEndpoints(input.pipe);
      scannerService.scan({
        ...input,
        endpoints,
        emit,
      });
    },
    updateReports({ input, emit }) {
      const reports = scannerService.updateReports();
      emit("reports", reports);
    },
  });
