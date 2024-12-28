import { Reactor } from "./reactor";

export interface ReactorBuilder<TState, TInput, TOutput> {
  handlerMap(handlerMap: {
    [TSignalName in keyof TInput]: Reactor<TState, TInput, TOutput, TSignalName>;
  }): this;
  build(): Reactor<any, any, any>;
}
