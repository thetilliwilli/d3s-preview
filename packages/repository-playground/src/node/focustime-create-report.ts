import { NodeBuilder } from "@d3s/runtime";
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import { FlameChartService } from "../service/flame-chart-service.js";
import { LogService } from "../service/log-service.js";
import { Reporter } from "../service/reporter.js";

export const focustimeCreateReport = new NodeBuilder()
    .withInput({
      logDirectory: "focustime-logs",
      reportDirectory: "reports",
      logFilename: "",
      /** seconds */
      minSpanWidth: 60,
      create: null,
    })
    .withOutput({})
    .withHandlers({
      create({ input }) {
        const fileName = path.join(input.logDirectory, input.logFilename);
        const logs = LogService.loadLogs(fileName);
        const flameSpans = FlameChartService.getFlameSpans(
          input.minSpanWidth,
          logs
        );
        const dataInjectionString = JSON.stringify(flameSpans);
        const htmlDocument = Reporter.getHtml(dataInjectionString);
        const reportFilename = path.join(
          input.reportDirectory,
          `report-${path.parse(input.logFilename).name}.html`
        );
        writeFileSync(reportFilename, htmlDocument, "utf8");
        execSync(`start ${reportFilename}`);
      },
    })