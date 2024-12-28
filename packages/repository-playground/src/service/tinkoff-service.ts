export class TinkoffService {
  public static toPrice(quotation: { units: string; nano: number }): number {
    return Number.parseInt(quotation.units) + quotation.nano / 1e9;
  }
}
