type HostType = "node" | "web";

export interface HostSettings {
  type: HostType;
  source: string;
  readonly: false;
  // read
  /** 127.0.0.1:5000 */
  api?: {
    // protocol: "http:" | "https:";
    host: string;
    port: number;
  };
  apiCwd: false | string;
  tlsCert: string | undefined;
  auth: {
    enabled: boolean;
    token: string;
  };
  /** enables log to stdout or file */
  log: boolean | string;
}
