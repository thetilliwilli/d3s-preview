import { NodeBuilder } from "@d3s/runtime";
import { spawn } from "child_process";
import { rmSync, writeFileSync } from "fs";
import readline from "node:readline";

const defaultInput = {
  interpreter: "python",
  script: "",
  execOnInput: false,
  exec: null,
  abort: null,
};

const abortController = Symbol("abortController");

export const py = new NodeBuilder()
  // .withState({
  //   [abortController]: undefined as AbortController | undefined,
  // })
  .withInput(defaultInput)
  .withOutput({
    result: {},
    error: "",
    exitCode: 0 as number | null,
    exitSignal: "" as string | null,
  })
  .withHandlers({
    abort({ state, input, signal, instance, emit }) {
      instance[abortController]?.abort();
    },
  })
  .withHandler(({ state, input, output, signal, instance, emit }) => {
    if (signal.name === "exec" || input.execOnInput) {
      const script = getScript(input);
      const tempFilename = `py-script-${(Math.random() + "").slice(2)}.py`;
      writeFileSync(tempFilename, script, "utf8");

      instance[abortController]?.abort();
      instance[abortController] = new AbortController();

      const child = spawn(input.interpreter, [tempFilename], { signal: instance[abortController].signal });
      child.on("error", (error) => {
        emit("error", error + "");
        rmSync(tempFilename, { force: true });
      });
      child.on("exit", (exitCode, exitSignal) => {
        emit("exitCode", exitCode);
        emit("exitSignal", exitSignal);
        rmSync(tempFilename, { force: true });
      });

      readline
        .createInterface({
          input: child.stdout,
        })
        .on("line", (line) => {
          try {
            const signal = JSON.parse(line);
            Object.entries(signal)
              .filter(([name, _]) => Object.keys(output).includes(name))
              .forEach(([name, data]) => {
                emit(name as any, data);
              });
          } catch (_) {}
        });
    }
  });

function getScript(input: any): string {
  const script = input.script;

  const vars = Object.entries(input)
    .filter((x) => Object.keys(defaultInput).includes(x[0]) === false)
    .map((x) => `${x[0]} = json.loads(${JSON.stringify(JSON.stringify(x[1]))})`)
    .join("\n");

  return `#-----------prescript-----------
${getPrescript()}
#-----------vars-----------
${vars}
#-----------script-----------
${script}
`;
}

function getPrescript(): string {
  return `
import json
import sys

def emit(signal, value):
    print(json.dumps({signal:value}, ensure_ascii=False, separators=(',', ':')), flush=True)

def my_except_hook(exctype, value, traceback):
    emit("error", value.msg)

sys.excepthook = my_except_hook
`;
}
