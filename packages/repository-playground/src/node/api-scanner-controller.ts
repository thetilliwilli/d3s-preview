import { NodeBuilder } from "@d3s/runtime";

const initialState = {
  "0-clearPreviousData": null,
  "1-downloadDependencies": null,
  "2-gitlabGroupId": 0,
  "3-downloadOpenApi": null,
  "4-mailTo": "",
  "4.1-mailSubject": "",
  "5-requestDelay": 0,
  "6-requestSkip": 0,
  "7-requestTake": 0,
  "8-reponseSizeLimit": 1000,
  "9-runScan": null,
};

const handlers = Object.fromEntries(
  Object.keys(initialState).map((key) => [
    key,
    (ctx: any) => {
      ctx.emit(ctx.signal.name, ctx.signal.data);
    },
  ])
);

export const scannerController = new NodeBuilder()
  .withInput({ ...initialState })
  .withOutput({ ...initialState })
  .withHandlers(handlers as any);
