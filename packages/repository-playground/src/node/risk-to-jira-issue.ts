import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import { EndpointScanResult } from "../domain/endpoint-scan-result.js";

export const riskToJiraIssue = new NodeBuilder()
  .withInput({
    report: [] as EndpointScanResult[] | string,
    creator: "",
    label: "apiscan",
    run: null,
  })
  .withOutput({
    error: "",
    issues: [] as ReturnType<typeof toJiraIssue>[],
    done: null,
  })
  .withHandlers({
    run({ input, emit }) {
      const endpointTests: EndpointScanResult[] = Array.isArray(input.report)
        ? input.report
        : JSON.parse(fs.readFileSync(input.report, "utf8"));

      const issues = endpointTests.filter((x) => x.risk).map((x) => toJiraIssue(x, input.creator, input.label));

      emit("issues", issues);
      emit("done", null);
    },
  });

function getDescription(riskNote: string, riskRequest: string, riskResponse: string) {
  const notes = riskNote
    .split("\n")
    .map((x) => ` # ${x}`)
    .join("\n");
  return `*Описание:*
${notes}


*Воспроизведение:*
 # отправить запрос {code:java} ${riskRequest} {code}
 # пример ответа {code:java} ${riskResponse} {code}
 # результат - ???


*Рекомендации по устранению:*
 # настроить аутентификацию/авторизацию на сервисе
 # использовать mtls (для внешних интеграций)
 # использовать доступ к АПИ по IP whitelist'am (для внешних интеграций)
 # убрать ручку из внешнего доступа
 # включить авторизацию на прокси-балансере
`;
}

function toJiraIssue(endpoint: EndpointScanResult, issueCreator: string, label: string) {
  const { riskNote, riskRequest, riskResponse } = endpoint;
  return {
    Summary: `отсутствие авторизации на ${endpoint.path}`,
    Assignee: issueCreator,
    Reporter: issueCreator,
    Description: getDescription(riskNote, riskRequest, riskResponse),
    Labels: label,
  };
}
