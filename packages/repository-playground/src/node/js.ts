import { NodeBuilder } from "@d3s/runtime";
import { createRequire } from "node:module";

export const js = new NodeBuilder()
  .withInput({
    script: "",
    execOnInput: false,
    exec: null,
  })
  .withOutput({
    result: {},
    success: null,
    error: "",
  })
  .withHandler(({ input, output, signal, emit }) => {
    if (signal.name === "exec" || (input.execOnInput && signal.name !== "script" && signal.name !== "execOnInput")) {
      try {
        const vars = { ...input, ...output };
        const script = getScript(input.script);
        const evaluate = new Function("vars", "require", "signal", "input", script);
        const require = createRequire(process.cwd() + "/index.js"); //fake url, ссылка на несуществующий файл в рабочей директории
        const changes = evaluate(vars, require, signal, input);
        Object.entries(changes).forEach((change: any) => emit(change[0], change[1]));
        emit("success", null);
      } catch (e) {
        emit("error", e + "");
      }
    }
  });

function getScript(inputScript: string) {
  return `
    const changes = { __proto__: null };
    const scope = { __proto__: null };
    
    Object.entries(vars).forEach(([name, value]) => {
        scope[name] = value;
        Object.defineProperty(scope, name, {
            get() {
                return vars[name];
            },
            set(v) {
                changes[name] = v;
                vars[name] = v;
            }
        });
    })
    
    with (scope) {
        ${inputScript}
    }

    return changes
    `;
}
