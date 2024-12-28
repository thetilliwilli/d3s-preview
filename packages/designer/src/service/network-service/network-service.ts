import { ActiveNodeRequest, AddNodeRequest, DeleteNodeRequest, UpdateMetaRequest } from "@d3s/event";
import { NodeState, PositionState } from "@d3s/state";
import { debounce } from "@d3s/utils";
import { dia, shapes } from "@joint/core";
import { store } from "../../app/store";
import { bindingSlice } from "../../slice/binding-slice";
import { DeveloperTools } from "../developer-tools";
import { keyboardService } from "../keyboard";
import { socketClient } from "../socket-client-service";
import { addPaperEventHandlers } from "./add-paper-event-handlers";
import { redrawNetwork } from "./redraw-network";
import { NodeElement } from "./node-element";

class NetworkService {
  private graph = new dia.Graph({}, { cellNamespace: shapes });
  private paper?: dia.Paper;
  public paperElement?: HTMLDivElement;

  init(paperContainerElement: HTMLElement) {
    socketClient.init();

    this.paper = this.createPaper(paperContainerElement);

    this.subscribeGraphEvents();
    this.subscribePaperEvents();
    this.subscribeStoreEvents();
    this.subscribeKeyboardEvents();

    (window as any).devtools = new DeveloperTools(this.paper, this.graph);
  }

  destroy() {
    this.paper?.remove();
  }

  private createPaper(paperContainerElement: HTMLElement): dia.Paper {
    this.paperElement = window.document.createElement("div");
    this.paperElement.id = "paperId";

    paperContainerElement.appendChild(this.paperElement);

    const namespace = { standard: shapes.standard, NodeElement };

    return new dia.Paper({
      el: this.paperElement,
      model: this.graph,
      width: "100%",
      height: "100%",
      gridSize: 10,
      drawGrid: true,
      background: {
        color: "rgba(128, 128, 128, 0.3)",
      },
      cellViewNamespace: namespace,
      clickThreshold: 15, // для мобильных приложений
    });
  }

  private subscribeGraphEvents() {
    this.graph.on({
      "change:position": debounce((elementView, position) => {
        const nodeGuid = elementView.attributes.id;
        socketClient.send(
          new UpdateMetaRequest(nodeGuid, {
            position: new PositionState(position.x, position.y),
          })
        );
      }),
    });
  }

  private subscribePaperEvents() {
    if (this.paper) addPaperEventHandlers(this.paper);
  }

  private subscribeStoreEvents() {
    store.subscribe(() => {
      redrawNetwork(this.graph);
    });
  }

  private subscribeKeyboardEvents() {
    keyboardService.on("Escape", () => {
      store.dispatch(bindingSlice.actions.endBinding());
    });

    keyboardService.on("Delete", () => {
      const nodeGuid = store.getState().network.selectedNodes[0];
      socketClient.send(new DeleteNodeRequest(nodeGuid));
    });

    keyboardService.on("F2", () => {
      const network = store.getState().network;
      const selectedNodeGuid = network.selectedNodes[0];
      if (selectedNodeGuid) {
        const node = network.network.nodes[selectedNodeGuid];
        const name = prompt("Переименование", node.meta.name);
        if (name) socketClient.send(new UpdateMetaRequest(node.meta.guid, { name }));
      }
    });

    keyboardService.on("Slash", () => {
      const promptResult = prompt("Find node by guid or name:");
      const guidOrName = (promptResult || "").trim().toLowerCase();
      if (guidOrName !== "") {
        const node = Object.values(store.getState().network.network.nodes).find(
          (x) => x.meta.guid.indexOf(guidOrName) !== -1 || x.meta.name.toLowerCase().indexOf(guidOrName) !== -1
        );

        if (node !== undefined && this.paper) {
          const nodeElement = this.graph.getCell(node.meta.guid);

          const nodePosition = nodeElement.position();
          //HACK: fuck the jointjs typings
          const nodeSize = (nodeElement as any).size();
          const paperSize = this.paper.getArea();
          this.paper.translate(
            -nodePosition.x + paperSize.width / 2 - nodeSize.width / 2,
            -nodePosition.y + paperSize.height / 2 - nodeSize.height / 2
          );

          // окрашиваем и назад
          const rememberColor = nodeElement.attr(["body", "fill"]);
          nodeElement.attr({ body: { fill: "dodgerblue" } });
          setTimeout(() => {
            nodeElement.attr({ body: { fill: rememberColor } });
          }, 1000);
        }
      }
    });
    keyboardService.on("KeyA", (event: KeyboardEvent) => {
      if (event.ctrlKey === false) return;
      event.preventDefault();
      const nodeGuid = store.getState().network.selectedNodes[0];
      const active = !store.getState().network.network.nodes[nodeGuid].active;
      socketClient.send(new ActiveNodeRequest(nodeGuid, active));
    });

    // Keep track of mouse position for paste keyboard interaction
    let clientX = 0;
    let clientY = 0;
    this.paper?.el.addEventListener("mousemove", (event) => {
      clientX = event.clientX;
      clientY = event.clientY;
    });

    keyboardService.on("KeyV", async (event) => {
      if (this.paper === undefined) return;
      if (event.ctrlKey === false) return;

      const text = await navigator.clipboard.readText();
      const { x, y } = this.paper.clientToLocalPoint(clientX, clientY);

      const nodeState = JSON.parse(text);
      if (typeof nodeState.meta.nodeUri === "string") {
        const typedNodeState = nodeState as NodeState; // hack здесь на самом деле заполненые данные вместо DataKey
        const req = new AddNodeRequest(typedNodeState.meta.nodeUri);
        req.name = typedNodeState.meta.name;
        req.position = new PositionState(x, y);
        req.state = typedNodeState.state;
        req.input = typedNodeState.input;
        req.output = typedNodeState.output;
        socketClient.send(req);
      }
    });
  }
}

export const networkService = new NetworkService();
