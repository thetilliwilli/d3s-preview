import { NodeBuilder } from "@d3s/runtime";
import { execFileSync, execSync } from "child_process";

type PowershellParam = {
  Name: string;
  Type: string;
  IsMandatory: boolean;
  Position: number;
};

type Param = {
  name: string;
  type: "string" | "number" | "boolean" | "string[]" | "number[]" | "unknown" | "unknown[]";
  required: boolean;
  position: number;
  dirty: boolean;
  value: any;
};

const staticInput = {
  cmd: "",
  reset: null,
  exec: null,
  format: "",
  convertTo: "",
  dumbOutput: true,
  select: "",
};

export const pwsh = new NodeBuilder()
  .withState({
    params: [] as Param[],
  })
  .withInput(staticInput)
  .withOutput((state, input) => ({
    result: {} as any,
    error: "",
    resolvedCommand: "",
    compiledCommand: "",
  }))
  .withHandler(({ state, input, signal, emit }) => {
    if (signal.name[0] !== "$") return;
    const param = state.params.find((x) => x.name === signal.name);
    if (param) {
      param.dirty = true;
      param.value = signal.data;
    }
  })
  .withHandlers({
    cmd({ state, input, signal, emit }) {
      try {
        const resolveCommand = getResolvedCommand(input.cmd);
        state.params = getParams(resolveCommand);
        expandParams(input, state.params);
        emit("resolvedCommand", resolveCommand);
      } catch (error) {
        emit("error", error + "");
      }
    },
    reset({ state, input, signal, emit }) {
      resetParams(input, state.params);
    },
    exec({ state, input, signal, emit }) {
      try {
        const resolveCommand = getResolvedCommand(input.cmd);
        const compiledCommand = compileCommand(resolveCommand, state.params, input);
        const execOptions = input.dumbOutput ? { env: { TERM: "dumb" } } : undefined;
        const output = execFileSync("pwsh", ["-c", compiledCommand], execOptions).toString();
        const result = input.convertTo.toLowerCase() === "json" ? JSON.parse(output) : output;
        emit("compiledCommand", compiledCommand);
        emit("result", result);
      } catch (error) {
        emit("error", error + "");
      }
    },
  });

function getResolvedCommand(cmd: string) {
  const output = execFileSync("pwsh", [
    "-c",
    `Get-command ${cmd} | select {$_.ResolvedCommand.Name} | convertto-json`,
  ]).toString();
  const result = JSON.parse(output);
  const resolvedCmd = result["$_.ResolvedCommand.Name"];
  return resolvedCmd === null ? cmd : resolvedCmd;
}

function getParams(cmd: string): Param[] {
  const output = execFileSync("pwsh", [
    "-c",
    `pwsh -Command {(Get-Command ${cmd} | Select-Object ParameterSets).ParameterSets.Parameters | Select-Object Name, @{Name="Type"; Expression={$_.ParameterType.FullName}}, IsMandatory, Position | convertto-json}`,
  ]).toString();

  const powershellParams = JSON.parse(output) as PowershellParam[];

  const params: Param[] = powershellParams.map((x) => ({
    name: `$${x.Position > -1 ? x.Position : "-"}${x.Name}`,
    position: x.Position,
    required: x.IsMandatory,
    type: toParamType(x.Type),
    dirty: false,
    value: getDefaultValue(toParamType(x.Type)),
  }));

  return params;
}

function toParamType(powershellType: string): Param["type"] {
  let type = (() => {
    switch (powershellType) {
      case "System.String[]":
        return "string[]" as const;
      case "System.Int32[]":
        return "number[]" as const;
      case "System.String":
        return "string" as const;
      case "System.Int32":
        return "number" as const;
      case "System.Management.Automation.SwitchParameter":
        return "boolean" as const;
      default:
        return powershellType.slice(-2) === "[]" ? ("unknown[]" as const) : ("unknown" as const);
    }
  })();

  return type;
}

function resetParams(input: any, params: Param[]) {
  const previousProps = {} as any;

  for (const prop in staticInput) {
    previousProps[prop] = input[prop];
  }

  for (const prop in input) {
    delete input[prop];
  }

  for (const prop in previousProps) {
    input[prop] = previousProps[prop];
  }
}

function expandParams(input: any, params: Param[]) {
  resetParams(input, params);

  params.forEach((param) => {
    input[param.name] = param.value;
  });
}

function getDefaultValue(type: Param["type"]) {
  switch (type) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "string[]":
      return [];
    case "number[]":
      return [];
    case "unknown":
      return "";
    case "unknown[]":
      return [];
  }
}

function compileCommand(cmd: string, params: Param[], input: typeof staticInput) {
  let result = cmd;

  const dirtyParams = params.filter((x) => x.dirty);

  dirtyParams
    .filter((param) => param.position > -1)
    .forEach((param) => {
      result += " " + param.value;
    });
  ("");

  dirtyParams
    .filter((param) => param.position < -1)
    .forEach((param) => {
      const value = param.type === "boolean" ? "" : JSON.stringify(param.value);
      result += " " + `${param.name.slice(1)} ${value}`;
    });

  if (input.select !== "") result += ` | Select-Object ${input.select}`;
  if (input.format !== "") result += ` | Format-${input.format}`;
  if (input.convertTo !== "") result += ` | ConvertTo-${input.convertTo} -WarningAction SilentlyContinue`;

  return result;
}
