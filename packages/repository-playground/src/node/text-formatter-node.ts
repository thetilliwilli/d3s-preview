import { NodeBuilder } from "@d3s/runtime";
import { TextFormatter } from "../service/text-formatter.js";

const getTextFormatter = Symbol("textFormatter");

export const textFormatter = new NodeBuilder()
  .withState({
    formatter: "'value=' + @value",
    escapeCharacter: "@",
    contextPrefix: "_ctx_",
    predefinedVariables: [],
    context: { value: 0 } as any,
  })
  .withInput((state) => ({
    ...state,
  }))
  .withOutput({
    result: "",
  })
  .withHandlers({
    formatter({ input, instance, emit }) {
      instance[getTextFormatter] = new TextFormatter(input.formatter, {
        contextPrefix: input.contextPrefix,
        escapeCharacter: input.escapeCharacter,
        predefinedVariables: input.predefinedVariables,
      });
    },
    escapeCharacter({ input, instance, emit }) {
      instance[getTextFormatter] = new TextFormatter(input.formatter, {
        contextPrefix: input.contextPrefix,
        escapeCharacter: input.escapeCharacter,
        predefinedVariables: input.predefinedVariables,
      });
    },
    contextPrefix({ input, instance, emit }) {
      instance[getTextFormatter] = new TextFormatter(input.formatter, {
        contextPrefix: input.contextPrefix,
        escapeCharacter: input.escapeCharacter,
        predefinedVariables: input.predefinedVariables,
      });
    },
    predefinedVariables({ input, instance, emit }) {
      instance[getTextFormatter] = new TextFormatter(input.formatter, {
        contextPrefix: input.contextPrefix,
        escapeCharacter: input.escapeCharacter,
        predefinedVariables: input.predefinedVariables,
      });
    },
    context({ input, instance, emit }) {
      const textFormatter =
        instance[getTextFormatter] ||
        new TextFormatter(input.formatter, {
          contextPrefix: input.contextPrefix,
          escapeCharacter: input.escapeCharacter,
          predefinedVariables: input.predefinedVariables,
        });
      const result = textFormatter.formatAgainstContext(input.context);
      emit("result", result);
    },
  });
