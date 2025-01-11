import { DeleteBindingRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class DeleteBindingRequestHandler implements AbstractRequestHandler<DeleteBindingRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<DeleteBindingRequest>): Promise<void> {
    const binding = app.networkState.bindings[event.bindingGuid];

    // нам необходимо создать новый канал с данными и дублировать из выходного канала предыдущего нода
    // dataKey входного и выходного канала совпадают, потому что есть байндинг - поэтому можем взять данные из этого же канала
    if (app.networkState.nodes[binding.to.node]) {
      // rightNode может быть уже удалён - например когда поступил DeleteNodeRequest вначале удаляется нод потом байндинг
      const rightNodeInput = app.networkState.nodes[binding.to.node].input;
      rightNodeInput[binding.to.property] = app.data.new(app.data.get(rightNodeInput[binding.to.property]));
    }

    delete app.networkState.bindings[event.bindingGuid];
  }
}
