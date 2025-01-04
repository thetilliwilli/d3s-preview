import { NodeBuilder } from "@d3s/runtime";

// const state = {
//   parameters: {
//     input: {},
//     output: {},
//   },
//   function: "ctx => null",
// };

const input = {
  nodeIntent: "",
  ai: {
    token: "",
    prompt: {
      getInputParameters: `ты ассистент генерирующий код.
  проанализируй следующее описанию функции: {{input.nodeIntent}}.
  извлеки входные параметры и запиши их в формате json словаря, который соответвует формату {[название параметра]: описание параметра}
  напиши только json код без дополнительных описаний`,
      getOutputParameters: `ты ассистент генерирующий код.
  проанализируй следующее описанию функции: {{input.nodeIntent}}.
  извлеки выходные параметры и запиши их в формате json словаря, который соответвует формату {[название параметра]: описание параметра}
  напиши только json код без дополнительных описаний`,
      getNodeCode: `ты ассистент генерирующий код.
  сгенерируй javascript функцию в формате nodejs cjs.
  не экспортируй функцию в модуле напиши только код функции.
  напиши только код функции без объяснений.
  для запрос по АПИ к внешним сервисам используй бесплатные сервисы не требующих авторизации.
  для запрос по АПИ к внешним сервисам используй fetch.
  функция должна принимать один аргумент как словарь входных параметров.
  функция должна возвращать один аргумент как словарь состоящий из выходных параметров полученных по результатам выполнения основного кода функции.
  описание функции: {{input.nodeIntent}}.
  описание входных параметров: {{input.nodeGenerated.parameters.input}}.
  описание выходных параметров: {{input.nodeGenerated.parameters.output}}.`,
    },
  },
  nodeGenerated: {
    parameters: {
      input: {},
      output: {},
    },
    code: "ctx => null",
  },
  regenerate: null,
  run: null,
};

const output = {
  regenerated: null,
  result: "",
  done: null,
  error: "",
};

export const ai = new NodeBuilder()
  // .withState(state)
  .withInput(input)
  .withOutput(output)
  .withHandlers({
    async regenerate({ state, input, signal, instance, emit }) {
      const parametersPromptResult = await Promise.all([
        getPromptResult(
          input.ai.token,
          input.ai.prompt.getInputParameters.replace("{{input.nodeIntent}}", input.nodeIntent)
        ),
        getPromptResult(
          input.ai.token,
          input.ai.prompt.getOutputParameters.replace("{{input.nodeIntent}}", input.nodeIntent)
        ),
      ]);

      input.nodeGenerated.parameters = {
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

      const getNodeCodePromptFilled = input.ai.prompt.getNodeCode
        .replace("{{input.nodeIntent}}", input.nodeIntent)
        .replace("{{input.nodeGenerated.parameters.input}}", JSON.stringify(input.nodeGenerated.parameters.input))
        .replace("{{input.nodeGenerated.parameters.output}}", JSON.stringify(input.nodeGenerated.parameters.output));

      const nodeCodePromptResult = await getPromptResult(input.ai.token, getNodeCodePromptFilled);

      input.nodeGenerated.code = nodeCodePromptResult; //.trim().slice(14, -3).trim();
      emit("regenerated", null);
    },
    async run({ state, input, signal, instance, emit }) {
      const result = await eval(`(${input.nodeGenerated.code})(input)`);
      emit("result", result);
    },
  });

async function getPromptResult(token: string, prompt: string) {
  const result = await fetch(
    "https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 5000,
        stream: false,
      }),
    }
  ).then((x) => x.json());

  return result.choices[0].message.content;
}
