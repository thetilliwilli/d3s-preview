export type ReactorEmit<TSignalMap> = <TSignalName extends keyof TSignalMap>(
  singalName: TSignalName,
  data: TSignalMap[TSignalName]
) => void;
