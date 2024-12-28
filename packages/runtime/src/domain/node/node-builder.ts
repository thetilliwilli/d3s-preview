import { Dictionary, deepCopy } from "@d3s/utils";
import { RuntimeNode } from "./node";
import { Reactor } from "./reactor";

export class NodeBuilder<TState = {}, TInput = {}, TOutput = {}> {
  private state: TState = {} as any;
  private inputOrFactory: TInput | ((s: TState) => TInput) = {} as any;
  private outputOrFactory: TOutput | ((s: TState, i: TInput) => TOutput) = {} as any;
  private output: TOutput = {} as any;

  // hack
  private generalHandler: Reactor<TState, TInput, TOutput> = () => {};
  private handlers: {
    [TSignalName in keyof TInput]?: Reactor<TState, TInput, TOutput, TSignalName>;
  } = {} as any;

  public id: string = "";

  constructor() {
    this.build = this.build.bind(this);
  }

  public withState<T extends TState>(state: T): NodeBuilder<T, TInput, TOutput> {
    this.state = state;
    return this as any;
  }

  public withInput<T extends TInput>(inputOrFactory: T | ((s: TState) => T)): NodeBuilder<TState, T, TOutput> {
    this.inputOrFactory = inputOrFactory;
    return this as any;
  }

  public withOutput<T extends TOutput>(
    outputOrFactory: T | ((s: TState, i: TInput) => T)
  ): NodeBuilder<TState, TInput, T> {
    this.outputOrFactory = outputOrFactory;
    return this as any;
  }

  public withHandler(handler: Reactor<TState, TInput, TOutput>): this {
    this.generalHandler = handler;
    return this;
  }

  public withHandlers(handlers: {
    [TSignalName in keyof TInput]?: Reactor<TState, TInput, TOutput, TSignalName>;
  }): this {
    this.handlers = handlers;
    return this;
  }

  // это момент когда происходит связывание runtime'a и designtime'a
  // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!ПЕРЕПИСАТЬ ЗДЕСЬ ВСЁ - почему state берёться из this.state а не storedState, а input из storedInput
  public build(storedNodeState: {
    state: Dictionary<any>;
    input: Dictionary<any>;
    output: Dictionary<any>;
  }): [RuntimeNode, Dictionary<any>, Dictionary<any>, Dictionary<any>] {
    const { state: storedState, input: storedInput, output: storedOutput } = storedNodeState;

    const state = Object.fromEntries(
      Object.entries(this.state as Dictionary<any>).map(([propName, propValue]) => [
        propName,
        storedState[propName] === undefined ? propValue : storedState[propName],
      ])
    );

    //rethink: bad generics typings
    const preInput =
      typeof this.inputOrFactory === "function"
        ? (this.inputOrFactory as (s: any) => Dictionary<any>)(state)
        : this.inputOrFactory;

    const input = { ...preInput, ...storedInput };

    //rethink: bad generics typings
    const preOutput =
      typeof this.outputOrFactory === "function"
        ? (this.outputOrFactory as (s: any, i: any) => Dictionary<any>)(this.state, input)
        : this.outputOrFactory;

    const output = { ...preOutput, ...storedOutput };

    return [
      new RuntimeNode(this.handlers as any, this.generalHandler as any),
      deepCopy(state),
      deepCopy(input),
      deepCopy(output),
    ];
  }
}
