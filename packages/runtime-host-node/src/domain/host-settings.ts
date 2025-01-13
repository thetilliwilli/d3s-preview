type HostType = "node" | "web";

export interface HostSettings {
  type: HostType;
  save: false | string;
  /** 127.0.0.1:5000 */
  api?: {
    // protocol: "http:" | "https:";
    hostname: string;
    port: number;
  };
  apiCwd: false | string;
  tlsCert: string | undefined;
  auth: false | string;
  /** enables log to stdout or file */
  log: boolean | string;
}
