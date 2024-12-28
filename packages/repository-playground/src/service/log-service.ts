import { readFileSync } from "fs";
import { UnionLog } from "../domain/log/union-log.js";

export class LogService {
  public static loadLogs(filename: string): UnionLog[] {
    const content = readFileSync(filename, "utf8");

    let logs: UnionLog[] = [];
    try {
      logs = JSON.parse("[" + content.trim().slice(0, -1) + "]");
    } catch (error) {
      console.error(error);
    }
    return logs;
  }
}
