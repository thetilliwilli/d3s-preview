import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import { Endpoint } from "../domain/endpoint.js";
import { HarEntry } from "../domain/har-entry.js";
import { endpointService } from "../service/endpoint-service.js";

export const endpointSourceHar = new NodeBuilder()
  .withInput({
    name: "",
    pipe: "",
    cache: true,
    har: "",
    mimeTypes: [] as string[],
  })
  .withOutput({
    size: 0,
    pipe: "",
    error: "",
  })
  .withHandlers({
    async pipe({ input, signal, emit }) {
      await endpointService.actionOnEdnpoints({
        ...input,
        action: async () => {
          const entries = JSON.parse(fs.readFileSync(input.har, "utf8")).log.entries;

          return entries
            .filter((x: any) => {
              const mimeType = new HarEntry(x).getResponseMimeType();
              return input.mimeTypes.includes(mimeType);
            })
            .map((x: any) => harEntryToEndpoint(x));
        },
        emit,
      });
    },
  });

function harEntryToEndpoint(harEntry: any) {
  return new Endpoint({
    method: harEntry.request.method,
    url: harEntry.request.url,
    // headers: x.request.headers.reduce((headers: any, header: any) => {
    //   headers[header.name] = header.value;
    //   return headers;
    // }, {}),
    body: harEntry.request.postData.text,
  });
}
