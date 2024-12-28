export class HarEntry {
  constructor(private entry: any) {}

  public getResponseMimeType(): string {
    return this.entry.response.content.mimeType.split(";")[0].trim().toLowerCase();
  }

  public getResponseData(): string {
    return this.entry.response.content.encoding === "base64"
      ? Buffer.from(this.entry.response.content.text, "base64").toString()
      : this.entry.response.content.text;
  }
}
