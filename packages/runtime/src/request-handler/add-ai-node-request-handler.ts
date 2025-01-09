import { AddAiNodeRequest, AddNodeRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

const defaults = {
  prompt: {
    inputParameters: `ты ассистент генерирующий код.
    проанализируй следующее описание функции: "{{nodePrompt}}".
    извлеки входные параметры и запиши их в формате json словаря, который соответвует формату {[название параметра]: описание параметра}.
    напиши только raw json код без дополнительных описаний и без markdown backticks.`,
    outputParameters: `ты ассистент генерирующий код.
    проанализируй следующее описание функции: "{{nodePrompt}}".
    извлеки выходные параметры и запиши их в формате json словаря, который соответвует формату {[название параметра]: описание параметра}.
    напиши только raw json код без дополнительных описаний и без markdown backticks.`,
    nodeCode: `ты ассистент генерирующий код. ниже приведён список требований по генерации кода:
    - сгенерируй javascript функцию.
    - напиши весь код в одной функции.
    - напиши только raw javascript код функции без объяснений и без markdown backticks.
    - используй бесплатные сервисы без авторизации и без ключей доступа при запросах к внешним АПИ.
    - используй fetch при запросах к внешним АПИ.
    - функция должна принимать один аргумент как словарь входных параметров.
    - функция должна возвращать один аргумент как словарь состоящий из выходных параметров полученных по результатам выполнения основного кода функции.
    - описание функции: {{nodePrompt}}.
    - описание входных параметров: {{inputParameters}}.
    - описание выходных параметров: {{outputParameters}}.
    
    готовый код: `,
  },
};

export class AddAiNodeRequestHandler implements AbstractRequestHandler<AddAiNodeRequest, any> {
  public async handle({ app, event }: AbstractRequestHandlerContext<AddAiNodeRequest>): Promise<any> {
    const inputParametersPrompt = defaults.prompt.inputParameters
      .replace("{{nodePrompt}}", event.prompt)
      .split("\n")
      .map((x) => x.trim())
      .join("\n");
    const outputParametersPrompt = defaults.prompt.outputParameters
      .replace("{{nodePrompt}}", event.prompt)
      .split("\n")
      .map((x) => x.trim())
      .join("\n");

    console.log(`inputParametersPrompt: ${inputParametersPrompt}`);
    console.log(`outputParametersPrompt: ${outputParametersPrompt}`);

    const parametersPromptResult = await Promise.all([
      app.promptAi(inputParametersPrompt),
      app.promptAi(outputParametersPrompt),
    ]);

    const parameters = {
      input: JSON.parse(parametersPromptResult[0]),
      output: JSON.parse(parametersPromptResult[1]),
    };

    console.log(`parameters: ${parameters}`);

    const getNodeCodePromptFilled = defaults.prompt.nodeCode
      .replace("{{nodePrompt}}", event.prompt)
      .replace("{{inputParameters}}", JSON.stringify(parameters.input))
      .replace("{{outputParameters}}", JSON.stringify(parameters.output))
      .split("\n")
      .map((x) => x.trim())
      .join("\n");

    console.log(`getNodeCodePromptFilled: ${getNodeCodePromptFilled}`);

    const nodeCode = await app.promptAi(getNodeCodePromptFilled);

    console.log(`nodeCode: ${nodeCode}`);

    const addAiNodeRequest = new AddNodeRequest("@d3s/repository-playground.ai");

    addAiNodeRequest.input = {
      ...parameters.input,
      code: nodeCode,
    };

    addAiNodeRequest.output = parameters.output;

    await app.handle(addAiNodeRequest);
  }
}
