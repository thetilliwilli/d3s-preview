import { AddNodeRequest } from "@d3s/event";
import { dia } from "@joint/core";
import { store } from "../../app/store";
import { networkSlice } from "../../slice/network-slice";
import { uiSlice } from "../../slice/ui-slice";
import { socketClient } from "../socket-client-service";
import { PositionState } from "@d3s/state";
import { dataTransferTypes } from "../../domain/consts";

export function addPaperEventHandlers(paper: dia.Paper) {
  paper.on({
    all: (...args: any[]) => {
      if (store.getState().ui.isDebugging) console.log(...args);
    },

    // createPropertyEditor - создаем проперти эдитор и показываем свойства выделенного нода
    "element:pointerclick": (elementView) => {
      const nodeGuid = elementView.model.attributes.id;
      store.dispatch(networkSlice.actions.selectNode(nodeGuid));
    },

    // открываем редактор байндингов: где можно удалить байдинги
    "link:pointerclick": (link) => {
      const bindingGuids = link.model.attributes.bindings.map((x: any) => x.guid);
      store.dispatch(uiSlice.actions.selectBinding(bindingGuids));
    },

    // развыделяем нод закрываем все проперти едиторы
    "blank:pointerclick": (_event) => {
      store.dispatch(networkSlice.actions.clearSelection());
      store.dispatch(uiSlice.actions.clearBindingSelection());
    },

    // добавляем новый нод в нетворк
    "blank:pointerdblclick": (_event, x, y) => {
      const nodeUri = prompt("nodeUri") || "";
      const addEvent = new AddNodeRequest(nodeUri);
      addEvent.position = new PositionState(x, y);
      if (nodeUri !== null) socketClient.send(addEvent);
    },

    "blank:pointerdown": function (event) {
      const { clientX: x, clientY: y } = event;
      event.data = {
        panInProgress: {
          startPosition: { x, y },
          startTranslate: paper.translate(),
        },
      };
    },

    "blank:pointermove": function (event) {
      const { clientX: x, clientY: y } = event;

      if (!x || !y) throw new Error(`guard`);

      if (event.data.panInProgress !== undefined) {
        const panFactor = 1;
        const scale = paper.scale().sx;
        const { x: startX, y: startY } = event.data.panInProgress.startPosition;
        const deltaX = (startX - x) * (1 / scale) * panFactor;
        const deltaY = (startY - y) * (1 / scale) * panFactor;
        const startTranslate = event.data.panInProgress.startTranslate;
        paper.translate(startTranslate.tx - deltaX, startTranslate.ty - deltaY);
      }
    },

    "blank:pointerup": function (event) {
      delete event.data.panInProgress;
    },

    "element:pointerdown": function (elementView, event) {
      event.data = elementView.model.position();
    },

    "blank:mousewheel": function (event, x, y, delta) {
      if (event.offsetX === undefined) return;
      if (event.offsetY === undefined) return;

      event.preventDefault();

      const oldscale = paper.scale().sx;
      const newscale = oldscale + 0.1 * delta * oldscale;

      if (newscale > 0.2 && newscale < 5) {
        paper.scaleUniformAtPoint(newscale, { x: 0, y: 0 });
        paper.translate(-x * newscale + event.offsetX, -y * newscale + event.offsetY);
      }
    },

    "blank:contextmenu": function () {
      paper.translate(0, 0);
    },
  });

  //#region DnD
  paper.el.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  paper.el.addEventListener("dragenter", (e) => {
    e.preventDefault();
  });
  paper.el.addEventListener("dragleave", (e) => {
    e.preventDefault();
  });
  paper.el.addEventListener("drop", (e) => {
    e.preventDefault();
    // иначе не попадёт в ResourceImporter.dropListener
    const { x, y } = paper.clientToLocalPoint(e.clientX, e.clientY);
    const data = e.dataTransfer?.getData(dataTransferTypes.node);
    if (data !== undefined && data !== "") {
      e.stopPropagation();
      console.log(data);
      const node = JSON.parse(data);
      const req = new AddNodeRequest(node.uri);
      req.name = node.name;
      req.position = new PositionState(x - node.shiftX, y - node.shiftY);
      socketClient.send(req);
    }
  });
  //#endregion
}
