import { SendSignalRequest, eventNames } from "@d3s/event";
import { NodeState } from "@d3s/state";
import { RunContext } from "../domain/node/run-context.js";
import { Signal } from "../domain/node/signal.js";
import { Runtime } from "../domain/runtime/runtime.js";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";
import { OutcomingEvent } from "../domain/outcoming-event/outcoming-event.js";

export class SendSignalRequestHandler implements AbstractRequestHandler<SendSignalRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<SendSignalRequest>): Promise<void> {
    if (event.signalType === "output") {
      //HACK
      const nodeOutput = app.networkState.nodes[event.nodeGuid].output;
      const dataKey = nodeOutput[event.name];
      if (app.data.has(dataKey)) {
        app.data.set(dataKey, event.data);
      } else {
        nodeOutput[event.name] = app.data.new(event.data);
      }
    } else {
      const signal = new Signal(event.nodeGuid, event.name, event.data, "input");
      runRecursive(app, event.nodeGuid, signal, 0, true);
    }
  }
}

function findRightNodeSignals(app: Runtime, nodeGuid: string, signal: Signal) {
  return Object.values(app.networkState.bindings)
    .filter((binding) => binding.from.node === nodeGuid && binding.from.property === signal.name)
    .map((binding) => ({
      rightNodeGuid: binding.to.node,
      signal: new Signal(binding.to.node, binding.to.property, signal.data, "input"),
    }));
}

function runRecursive(
  app: Runtime,
  leftNodeGuid: string,
  inboundSignal: Signal,
  phase: number,
  isActivationSignal: boolean
) {
  inboundSignal.phase = phase;

  app.emitOutcomingEvent(new OutcomingEvent(eventNames.inboundSignal, inboundSignal));

  const node = app.nodes[leftNodeGuid];
  const nodeState = app.networkState.nodes[leftNodeGuid];

  //HACK
  const dataKey = nodeState.input[inboundSignal.name];
  if (app.data.has(dataKey)) {
    app.data.set(dataKey, inboundSignal.data);
  } else {
    nodeState.input[inboundSignal.name] = app.data.new(inboundSignal.data);
  }

  const emit = createEmit(app, leftNodeGuid, phase);

  const stateProxyObject = Object.entries(nodeState.state).reduce((acc, val) => {
    Object.defineProperty(acc, val[0], {
      get() {
        return app.data.get(val[1]);
      },
      set(v) {
        return app.data.set(val[1], v);
      },
    });
    return acc;
  }, {});

  const instance =
    app.instances[nodeState.meta.guid] === undefined
      ? (app.instances[nodeState.meta.guid] = {})
      : app.instances[nodeState.meta.guid];

  const input = createInputContext(app, nodeState);

  const runContext = new RunContext(
    inboundSignal,
    input,
    stateProxyObject,
    Object.fromEntries(Object.entries(nodeState.output).map((x) => [x[0], app.data.get(x[1])])),
    instance,
    (signalName: string, data: any) => {
      //HACK
      const dataKey = nodeState.output[signalName];
      if (app.data.has(dataKey)) {
        app.data.set(dataKey, data);
      } else {
        nodeState.output[signalName] = app.data.new(data);
      }

      emit(new Signal(leftNodeGuid, signalName, data, "output"));
    }
  );

  if (nodeState.active || (!nodeState.active && isActivationSignal)) node.run(runContext);
}

function createEmit(app: Runtime, leftNodeGuid: string, phase: number) {
  return function emit(outboundSignal: Signal) {
    //фаза аутупут сигнала на одном и том же ноде должна соответвовать фазе инпут сигнала
    outboundSignal.phase = ++phase;
    app.emitOutcomingEvent(new OutcomingEvent(eventNames.outboundSignal, outboundSignal));

    const rightNodeSignals = findRightNodeSignals(app, leftNodeGuid, outboundSignal);

    for (const { rightNodeGuid, signal } of rightNodeSignals) {
      runRecursive(app, rightNodeGuid, signal, ++phase, false);
    }
  };
}

function createInputContext(app: Runtime, node: NodeState) {
  const nodeGuid = node.meta.guid;
  const entries = Object.entries(node.input).map(([name, dataKey]) => {
    const boundBinding = Object.values(app.networkState.bindings).find(
      (binding) => binding.to.node === nodeGuid && binding.to.property === name
    );

    const value =
      boundBinding === undefined
        ? app.data.get(dataKey)
        : app.data.get(app.networkState.nodes[boundBinding.from.node].output[boundBinding.from.property]);

    return [name, value];
  });

  const input = Object.fromEntries(entries);

  return input;
}
