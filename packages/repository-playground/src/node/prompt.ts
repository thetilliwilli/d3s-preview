import { NodeBuilder } from "@d3s/runtime";
import readline from "node:readline";

export const prompt = new NodeBuilder()
  .withInput({
    question: "input:",
    prompt: null,
  })
  .withOutput({
    answer: "",
  })
  .withHandlers({
    async prompt({ state, input, signal, instance, emit }) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(`What's your name?`, (anwser) => {
        emit("answer", anwser);
        rl.close();
      });
    },
  });
