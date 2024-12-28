import { BindingState } from "@d3s/state";

class BindingService {
  groupByFromNode(bindings: BindingState[]) {
    const group: { [compositeKey: string]: BindingState[] } = {};

    bindings.forEach((x) => {
      const compositeKey = [x.from.node, x.to.node]
        //   .sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
        .join("->");
      if (!group[compositeKey]) group[compositeKey] = [];
      group[compositeKey].push(x);
    });

    return group;
  }

  groupByFromAndToNode(bindings: BindingState[]) {
    const group: { [compositeKey: string]: BindingState[] } = {};

    bindings.forEach((x) => {
      const compositeKey = [x.from.node, x.to.node].sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0)).join("<->");
      if (!group[compositeKey]) group[compositeKey] = [];
      group[compositeKey].push(x);
    });

    return group;
  }
}

export const bindingService = new BindingService();
