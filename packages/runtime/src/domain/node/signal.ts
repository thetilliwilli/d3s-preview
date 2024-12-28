export class Signal<TSignalName = string, TSignalData = any> {
  // HACK
  public phase = 0;
  constructor(
    public nodeGuid: string,
    public name: TSignalName,
    public data: TSignalData,
    public type: "input" | "output"
  ) {}
}
