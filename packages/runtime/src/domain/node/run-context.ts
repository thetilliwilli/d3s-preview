import { Dictionary } from "@d3s/utils";
import { Signal } from "./signal";
import { ReactorEmit } from "./reactor-emit";

export class RunContext {
  constructor(
    public signal: Signal,
    public input: Dictionary<any>,
    public state: Dictionary<any>,
    public output: Dictionary<any>,
    public instance: { [key: string | number | symbol]: any },
    public emit: ReactorEmit<Dictionary<any>>
  ) {}
}