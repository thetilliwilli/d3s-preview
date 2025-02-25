import { AddNodeRequest } from "@d3s/event";
import { PositionState } from "@d3s/state";
import { dia } from "@joint/core";
import { store } from "../../app/store";
import { networkSlice } from "../../slice/network-slice";
import { uiSlice } from "../../slice/ui-slice";
import { socketClient } from "../socket-client-service";
import { ImportService } from "./import-service";

export function addPaperEventHandlers(paper: dia.Paper) {
  paper.on({
    // createPropertyEditor - создаем проперти эдитор и показываем свойства выделенного нода
    "element:pointerclick": (elementView) => {
      store.dispatch(uiSlice.actions.hideOmnibox());
      const nodeGuid = elementView.model.attributes.id;
      store.dispatch(networkSlice.actions.selectNode(nodeGuid));
    },

    // открываем редактор байндингов: где можно удалить байдинги
    "link:pointerclick": (link) => {
      store.dispatch(uiSlice.actions.hideOmnibox());
      const bindingGuids = link.model.attributes.bindings.map((x: any) => x.guid);
      store.dispatch(uiSlice.actions.selectBinding(bindingGuids));
    },

    // развыделяем нод закрываем все проперти едиторы
    "blank:pointerclick": (_event) => {
      store.dispatch(networkSlice.actions.clearSelection());
      store.dispatch(uiSlice.actions.clearBindingSelection());
      store.dispatch(uiSlice.actions.hideOmnibox());
    },

    // добавляем новый нод в нетворк
    "blank:pointerdblclick": (_event, x, y) => {
      const nodeUri = "@d3s/repository-playground.js";
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
    e.stopPropagation();

    // иначе не попадёт в ResourceImporter.dropListener
    const request = ImportService.parse(e.dataTransfer);

    if (request) {
      const { x, y } = paper.clientToLocalPoint(e.clientX, e.clientY);
      (request as AddNodeRequest).position = new PositionState(x, y);
      console.log(request);
      if (
        request.type === "AddNodeRequest" &&
        "nodeUri" in request &&
        request.nodeUri === "@d3s/repository-playground.ai"
      )
        store.dispatch(uiSlice.actions.setAiGeneratedAddNodeRequest(undefined));
      socketClient.send(request);
    }
  });
  //#endregion
}
