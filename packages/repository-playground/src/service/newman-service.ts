import { NewmanRunExecution, NewmanRunOptions, run } from "newman";
import path from "path";
import fs from "fs";
import crypto from "crypto";

type Progress = {
  percents: string;
  collection: string;
  host: string;
  summary: string;
};

type RunResult = {
  error: string | undefined;
  assertions: {
    error: {
      message: string;
      test: string;
    };
    name: string;
    url: string;
  }[];
  endpointScanResults: ReturnType<typeof toEndpointScanResult>[];
};

export class NewmanService {
  public async run(options: NewmanRunOptions, prerequestScript: string, testScript: string) {
    //hack
    (options.collection as any).event = [
      {
        listen: "prerequest",
        script: {
          type: "text/javascript",
          exec: prerequestScript.split("\n"),
        },
      },
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: testScript.split("\n"),
        },
      },
    ];

    const mergedOptions: NewmanRunOptions = {
      collection: options.collection,
      reporters: "htmlextra",
      insecure: true,
      delayRequest: options.delayRequest,
      reporter: {
        htmlextra: {
          export: options.reporter.htmlextra.export,
          showOnlyFails: options.reporter.htmlextra.showOnlyFails,
          omitRequestBodies: true,
          noSyntaxHighlighting: true,
        },
      },
      envVar: options.envVar,
      requestAgents: options.requestAgents,
    };

    return new Promise((resolve: (value: RunResult) => void, reject) => {
      run(mergedOptions, function (err, summary) {
        const endpointScanResults = summary.run.executions.map(toEndpointScanResult);

        const assertions = summary.run.executions
          .filter((x) => x.assertions[0].error)
          .map((x) => ({
            error: { message: x.assertions[0].error.message, test: x.assertions[0].error.test },
            name: x.item.name,
            url: x.request.url.toString(),
          }));

        resolve({ error: err?.message, assertions, endpointScanResults });
      });
    });
  }

  public getProgressInfo(
    i: number,
    collectionPaths: string[],
    j: number,
    varsArray: { scheme: string; host: string; useExternalUrl: string }[],
    skipped: boolean
  ): Progress {
    const runnedCases = 1 + j + i * varsArray.length;
    const allCases = varsArray.length * collectionPaths.length;

    const percents = ((runnedCases / allCases) * 100).toFixed(2) + "%";
    const collection = path.basename(collectionPaths[i]);
    const host = varsArray[j].host;
    const state = skipped ? "skip" : "run";
    const summary = `${state} ${runnedCases}/${allCases} ${collection} on ${host}`;

    return {
      percents,
      collection,
      host,
      summary: summary,
    };
  }

  public makeReportHtml(reportDirScanRun: string) {
    const scanRunTables = fs.readdirSync(reportDirScanRun).map((scanRun) => {
      const assertedDir = path.posix.join(reportDirScanRun, scanRun, "asserted");

      const reports = fs.readdirSync(assertedDir).map((x) => {
        const filename = x;
        const file = path.posix.join(assertedDir, x);
        const size = (fs.statSync(file).size / 1024 / 1024).toFixed(2) + "mb";
        return {
          filename,
          file,
          size,
        };
      });

      const reportRows = reports.map(
        (report) => `<tr>
      <td><a href="${report.file}">${report.filename}</a></td>
      <td>${report.size}</td>
    </tr>`
      );

      return `
      <div>
        <button type="button" class="collapsible">ScanRun ${scanRun}</button>
          <table class="content" style="display:none">
            <tr>
              <th>file</th>
              <th>size</th>
            </tr>
            ${reportRows.join("\n")}
          </table>
      </div>
        `;
    });

    const reportHtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ScanReport</title>
        <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            
            td, th {
              border: 1px solid #dddddd;
              text-align: left;
              padding: 8px;
            }
            
            tr:nth-child(even) {
              background-color: #dddddd;
            }

            .collapsible {
              background-color: grey;
              color: white;
              cursor: pointer;
              padding: 18px;
              width: 100%;
              border: none;
              text-align: left;
              outline: none;
              font-size: 15px;
              border: 1px solid black;
              margin-bottom: 4px;
            }
            
            .active, .collapsible:hover {
              background-color: green;
            }
            
            .collapsible:after {
              content: '\u002B';
              color: white;
              font-weight: bold;
              float: right;
              margin-left: 5px;
            }
            
            .active:after {
              content: "\u2212";
            }
            
            .content {
              padding: 0 18px;
              max-height: 0;
              overflow: hidden;
              transition: max-height 0.2s ease-out;
              background-color: #f1f1f1;
            }
            </style>
    </head>
    <body>
        ${scanRunTables.join("\n")}

        <script>
        var coll = document.getElementsByClassName("collapsible");
        var i;

        for (i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function () {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.display === "table") {
                    content.style.display = "none";
                } else {
                    content.style.display = "table";
                }
            });
        }
    </script>
    </body>
    </html>`;

    fs.writeFileSync("report.html", reportHtml);
  }

  public filterAndModifyReport(inFilePath: string, outFilePath: string, reponseSizeLimit: number) {
    const patterns = [
      /function get_cookie_spsc_encrypted_part\(/g,
      /&quot;Message&quot;:&quot;Request Content-Type is not multipart\/form-data&quot;/g,
      /Message&gt;An error occurred when parsing the HTTP request POST at/g,
      /&lt;Message&gt;The specified method is not allowed against this resource\.&lt;\/Message&gt;/g,
    ];

    const inFileContent = fs.readFileSync(inFilePath, "utf8");

    const start = inFileContent.indexOf(`aria-selected="false">Failed Tests`);
    const end = inFileContent.indexOf(`aria-selected="false">Skipped Tests`);
    const totalRequestCountString = inFileContent.slice(start, end).split("span")[1].slice(0, -2).split(">")[1];
    const totalRequestCount = Number.parseInt(totalRequestCountString);

    const matchResults = patterns.map((pattern) => (inFileContent.match(pattern) || []).length);
    const shouldSkip = matchResults.filter((x) => x === totalRequestCount).length > 0;

    if (!shouldSkip) {
      const modifiedReport = this.modifyReport(inFileContent, reponseSizeLimit);
      fs.writeFileSync(outFilePath, modifiedReport);
    }
  }

  private modifyReport(content: string, reponseSizeLimit: number) {
    let result = content;

    if (reponseSizeLimit > -1) {
      result = "";
      const responseBodyStart =
        '<h5 class="card-title text-uppercase text-white text-center bg-info">Response Body</h5>';
      const reponseBodyEnd = "</code></pre>";
      // это необходимо потому что в отчетах после responseBodyStart еще дет кусочек с разметкой которую трудно распарсить
      // <pre><code id="copyText-0aead075-6a33-44cb-929a-721693d92cfa"
      const minimumLimit = 250;
      const limit = minimumLimit + reponseSizeLimit;

      let cursorNextStart = 0;
      let cursorNextEnd = 0;

      while ((cursorNextStart = content.indexOf(responseBodyStart, cursorNextEnd)) !== -1) {
        //копируем контент от конца responseBody до следующего responseStart
        result += content.slice(cursorNextEnd, cursorNextStart);

        //вырезаем response
        let reponseBodyEndIndex = content.indexOf(reponseBodyEnd, cursorNextStart);
        let response = content.slice(cursorNextStart, reponseBodyEndIndex);
        let truncatedReponse = response.slice(0, limit);
        result += truncatedReponse;

        cursorNextEnd = reponseBodyEndIndex;
      }

      result += content.slice(cursorNextEnd);
    }

    result = result.replace(
      `return xml.split('\\r\\n').map((node, index) => {`,
      `return xml.length > 10000 ? xml : xml.split('\\r\\n').map((node, index) => {`
    );

    return result;
  }
}

// TODO refectoring
function toEndpointScanResult(execution: NewmanRunExecution & { requestError?: Error }) {
  const assertion = (execution.assertions || []).find((x) => x.error !== undefined);
  const hasAssertionWithError = assertion !== undefined;

  return {
    guid: crypto.randomUUID(),
    protocol: execution.request.url.protocol,
    host: (execution.request.url.host || []).join("."),
    request: {
      url: execution.request.url.toString(),
      path: "/" + (execution.request.url.path || []).join("/"),
      method: execution.request.method,
    },
    requestError: execution.requestError?.message,
    response:
      execution.response === undefined
        ? {
            statusCode: 0,
            statusText: "",
            size: 0,
            time: 0,
            headers: {},
            body: "",
          }
        : {
            statusCode: execution.response.code,
            statusText: execution.response.status,
            size: execution.response.responseSize,
            time: execution.response.responseTime,
            headers: Object.fromEntries(execution.response.headers.toJSON().map((x: any) => [x.key, x.value])),
            body: (execution.response.stream || "").toString(),
          },
    responseTruncated: false,

    authEnabled: !hasAssertionWithError,
    testName: hasAssertionWithError ? assertion.error.test : "",
    testError: hasAssertionWithError ? assertion.error.message : "",
  };
}
