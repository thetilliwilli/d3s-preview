import { NodeBuilder } from "@d3s/runtime";
import { execSync } from "child_process";

export const getADUsers = new NodeBuilder()
  .withInput({
    input: "",
    output: "",
    run: null,
  })
  .withOutput({
    finished: null,
  })
  .withHandlers({
    run({ input, signal, emit }) {
      const result = execSync(
        `powershell ./getADUsers.ps1 -input_csv_file "${input.input}" -output_csv_file "${input.output}"`
      ).toString("utf-8");
      emit("finished", null);
    },
  });
