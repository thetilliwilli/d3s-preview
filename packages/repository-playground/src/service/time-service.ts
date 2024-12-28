import path from "path";

export class TimeService {
  public static getTodayFilename(logDirectory: string): string {
    const fileName = path.join(
      logDirectory,
      new Date().toISOString().split("T")[0] + ".json"
    );
    return fileName;
  }
}
