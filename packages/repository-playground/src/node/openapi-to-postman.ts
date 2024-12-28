import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import Converter from "openapi-to-postmanv2";

export const openapiToPostman = new NodeBuilder()
  .withInput({
    inFile: "",
    outFile: "",
    convert: null,
  })
  .withOutput({
    result: {} as any,
    error: "",
  })
  .withHandlers({
    convert({ input, signal, emit }) {
      Converter.convert(
        { type: "file", data: input.inFile },
        { folderStrategy: "Tags", includeAuthInfoInExample: false },
        (error, result) => {
          if (error) emit("error", error + "");

          if (!result.result) emit("error", result.reason);
          else {
            const collection = result.output[0].data;
            const jsonString = JSON.stringify(collection);
            fs.writeFileSync(input.outFile, jsonString);
          }
        }
      );
    },
  });
