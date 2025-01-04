import { AddNodeRequest, DeleteNodeRequest, eventNames, AddAiNodeRequest, SendSignalRequest } from "@d3s/event";
import { Signal } from "../domain/node/signal";
import { GuidService } from "../service/guid-service";
import { AbstractRequestHandler } from "./abstract-request-handler";
import { AbstractRequestHandlerContext } from "./app-event-request-handler";

const defaults = {
  prompt: {
    inputParameters: `ты ассистент генерирующий код.
    проанализируй следующее описанию функции: {{nodePrompt}}.
    извлеки входные параметры и запиши их в формате json словаря, который соответвует формату {[название параметра]: описание параметра}.
    напиши только raw json код без дополнительных описаний и без markdown backticks.`,
    outputParameters: `ты ассистент генерирующий код.
    проанализируй следующее описанию функции: {{nodePrompt}}.
    извлеки выходные параметры и запиши их в формате json словаря, который соответвует формату {[название параметра]: описание параметра}.
    напиши только raw json код без дополнительных описаний и без markdown backticks.`,
    nodeCode: `ты ассистент генерирующий код.
    сгенерируй javascript функцию в формате nodejs cjs.
    не экспортируй функцию в модуле.
    напиши только raw javascript код функции без объяснений и без markdown backticks.
    используй бесплатные сервисы без авторизации при запросах к внешним АПИ.
    используй fetch при запросах к внешним АПИ.
    функция должна принимать один аргумент как словарь входных параметров.
    функция должна возвращать один аргумент как словарь состоящий из выходных параметров полученных по результатам выполнения основного кода функции.
    описание функции: {{nodePrompt}}.
    описание входных параметров: {{inputParameters}}.
    описание выходных параметров: {{outputParameters}}.`,
  },
};

export class AddAiNodeRequestHandler implements AbstractRequestHandler<AddAiNodeRequest, any> {
  public async handle({ app, event }: AbstractRequestHandlerContext<AddAiNodeRequest>): Promise<any> {
    // создать нод
    // const tempNodeGuid = GuidService.getGuid();

    const inputParametersPrompt = defaults.prompt.inputParameters.replace("{{nodePrompt}}", event.prompt);
    const outputParametersPrompt = defaults.prompt.outputParameters.replace("{{nodePrompt}}", event.prompt);
    const parametersPromptResult = await Promise.all([
      app.promptAi(inputParametersPrompt),
      app.promptAi(outputParametersPrompt),
      // getPromptResult(
      //   input.ai.token,
      //   input.ai.prompt.getInputParameters.replace("{{input.nodeIntent}}", input.nodeIntent)
      // ),
      // getPromptResult(
      //   input.ai.token,
      //   input.ai.prompt.getOutputParameters.replace("{{input.nodeIntent}}", input.nodeIntent)
      // ),
    ]);

    const parameters = {
      input: JSON.parse(parametersPromptResult[0]),
      output: JSON.parse(parametersPromptResult[1]),
    };

    // input.nodeGenerated.parameters.input = await getPromptResult(
    //   input.ai.token,
    //   input.ai.prompt.getInputParameters.replace("{{input.nodeIntent}}", input.nodeIntent)
    // );
    // input.nodeGenerated.parameters.output = await getPromptResult(
    //   input.ai.token,
    //   input.ai.prompt.getOutputParameters.replace("{{input.nodeIntent}}", input.nodeIntent)
    // );

    const getNodeCodePromptFilled = defaults.prompt.nodeCode
      .replace("{{nodePrompt}}", event.prompt)
      .replace("{{inputParameters}}", JSON.stringify(parameters.input))
      .replace("{{outputParameters}}", JSON.stringify(parameters.output));

    const nodeCode = await app.promptAi(getNodeCodePromptFilled);

    // input.nodeGenerated.code = nodeCode; //.trim().slice(14, -3).trim();
    // emit("regenerated", null);

    const addAiNodeRequest = new AddNodeRequest("@d3s/repository-playground.ai");

    addAiNodeRequest.input = {
      code: nodeCode,
      ...parameters.input,
    };

    addAiNodeRequest.output = parameters.output;

    await app.handle(addAiNodeRequest);
    // addNodeRequest.input = event.input;
    // addNodeRequest.guid = tempNodeGuid;
    // return new Promise((resolve, reject) => {
    //   app.once(eventNames.outboundSignal, (signal: Signal) => {
    //     if (signal.nodeGuid === tempNodeGuid && signal.type === "output" && signal.name === event.output) {
    //       // удалить нод
    //       app.handle(new DeleteNodeRequest(tempNodeGuid));

    //       // вернуть результат
    //       resolve(app.getData({ nodeGuid: tempNodeGuid, scope: "output", property: event.output }));
    //     }
    //   });
    //   // вызвать node.run
    //   const sendSignalRequest = new SendSignalRequest(tempNodeGuid, event.invoke, "input");
    //   app.handle(sendSignalRequest);
    // });
  }
}
