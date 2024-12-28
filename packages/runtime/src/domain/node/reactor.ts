import { ReactorEmit } from "./reactor-emit";
import { Signal } from "./signal";

export type Reactor<TState, TInput, TOutput, TSignalName extends keyof TInput = keyof TInput> = (ctx: {
  signal: Signal<TSignalName, TInput[TSignalName]>;
  state: TState;
  input: TInput;
  output: TOutput;
  /** временный объект существующий только в рантайме для хранения произвольных данных */
  instance: { [key: string | number | symbol]: any };
  emit: ReactorEmit<TOutput>;
}) => void | Promise<void>;

// провести типизацию выше на уровне Node. public abstract getReactor(): DesigntimeReactor<TState, TInput, TOutput>;
