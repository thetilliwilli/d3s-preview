export class GuidService {
  static getGuid(): string {
    return crypto.randomUUID();
  }
}
