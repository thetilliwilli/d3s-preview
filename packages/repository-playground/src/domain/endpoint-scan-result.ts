export type EndpointScanResult = {
  guid: string;
  protocol: string;
  host: string;
  port: string;
  path: string;
  method: string;
  code: number;
  status: string;
  type: string;
  size: number;
  time: number;
  headers: string;
  body: string;
  error: string;
  risk: boolean;
  riskRequest: string;
  riskResponse: string;
  riskNote: string;
  diff: "new" | "changed" | "same" | "";
  diffs: { attr: string; prev: string; next: string }[];
};