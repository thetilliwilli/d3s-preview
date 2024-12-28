import { NodeBuilder } from "@d3s/runtime";
import { endpointService } from "../service/endpoint-service.js";

export const scannerReport = new NodeBuilder()
  .withInput({
    allScanResultPipe: "",
    scanResultPipe: "",
    view: "/*@view*/",
  })
  .withOutput({
    allScanReportsPipes: [] as string[],
    scanReportPipe: "",
  })
  .withHandlers({
    scanResultPipe({ state, input, signal, instance, emit }) {
      emit("allScanReportsPipes", endpointService.getPipes(input.allScanResultPipe));
      emit("scanReportPipe", input.scanResultPipe);
    },
  });
