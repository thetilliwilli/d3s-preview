import { AddBindingRequest, AddEntityRequest, AddNodeRequest, DeleteNodeRequest } from "@d3s/event";
import { AddBindingRequestHandler } from "./add-binding-request-handler.js";
import { AddNodeRequestHandler } from "./add-node-request-handler.js";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";
import { DeleteNodeRequestHandler } from "./delete-node-request-handler.js";
// import { xml2js } from "xml-js";

const nodeUriBase = "@d3s/repository-threat-modeler";
const unknowEntityType = "ThreatEntityNode";
const shapeToNodeUriMapping: any = {
  "mxgraph.c4.webBrowserContainer": "FrontendNode",
  hexagon: "BackendNode",
  cylinder3: "DatabaseNode",
};

type C4Element = {
  position: {
    x: number;
    y: number;
  };
  info: {
    container: string;
    description: string;
    technology: string;
    type: string;
    name: string;
  };
  shape: string;
};

function getAddNodeRequests(mxGraphModelRootObject: any[]): AddNodeRequest[] {
  const c4Elements = mxGraphModelRootObject.map((x: any) => ({
    position: {
      x: Number.parseInt(x.mxCell.mxGeometry._attributes.x) || 0,
      y: Number.parseInt(x.mxCell.mxGeometry._attributes.y) || 0,
    },
    info: {
      container: (x._attributes.c4Container || "").trim(),
      description: (x._attributes.c4Description || "").trim(),
      technology: (x._attributes.c4Technology || "").trim(),
      type: (x._attributes.c4Type || "").trim(),
      name: (x._attributes.c4Name || "").trim(),
      externalId: x._attributes.id,
    },
    shape: x.mxCell._attributes.style.split("shape=")[1]?.split(";")[0],
  }));

  const xScale =
    (Math.max(...c4Elements.map((x) => x.position.x)) - Math.min(...c4Elements.map((x) => x.position.x))) / 1200;
  const yScale =
    (Math.max(...c4Elements.map((x) => x.position.y)) - Math.min(...c4Elements.map((x) => x.position.y))) / 600;

  const addNodeEvents = c4Elements
    .map((x) => {
      x.position.x /= xScale;
      x.position.y /= yScale;
      return x;
    })
    .map((element) => {
      // составляем имя из всех значимых не пустых элементов
      const name = [element.info.name, element.info.type, element.info.description]
        .filter((x) => x !== undefined)
        .map((x) => x.trim())
        .filter((x) => x !== "")
        .join("\n");

      const nodeUrl = shapeToNodeUriMapping[element.shape] || unknowEntityType;
      const nodeUri = `${nodeUriBase}.${nodeUrl}`;

      const addNodeRequest = new AddNodeRequest(nodeUri);
      addNodeRequest.position = element.position;
      addNodeRequest.name = name;
      addNodeRequest.state = { externalId: element.info.externalId };

      return addNodeRequest;
    });

  return addNodeEvents;
}

function findProtocol(element: any) {
  const value = [
    element._attributes.value,
    element._attributes.c4Type,
    element._attributes.c4Technology,
    element._attributes.c4Description,
  ]
    .join()
    .toLowerCase();

  return value.includes("http") || value.includes("rest") ? "https" : "none";
}

function getAddBindingRequests(externalIdToNodeGuidMap: any, elementConnections: any[]): AddBindingRequest[] {
  const result = elementConnections
    .map((x) => {
      const selfProtocol = findProtocol(x);
      const parent = elementConnections.find((y) => y._attributes.parent === x._attributes.id);
      const parentProtocol = parent === undefined ? "none" : findProtocol(parent);
      const protocol = selfProtocol === "none" ? parentProtocol : selfProtocol;

      return {
        protocol,
        fromNodeGuid: externalIdToNodeGuidMap[x._attributes.source],
        toNodeGuid: externalIdToNodeGuidMap[x._attributes.target],
      };
    })
    .filter((x) => x.fromNodeGuid !== undefined && x.toNodeGuid !== undefined)
    .map((x) => new AddBindingRequest(x.fromNodeGuid, x.protocol, x.toNodeGuid, x.protocol));
  return result;
}

export class AddEntityRequestHandler implements AbstractRequestHandler<AddEntityRequest> {
  public async handle({ app, event }: AbstractRequestHandlerContext<AddEntityRequest>): Promise<void> {
    // var jsonObject = xml2js(event.entityData, { compact: true }) as any;
    // const rootObjects = jsonObject.mxfile.diagram.mxGraphModel.root.object as any[];
    // const rootMxCells = jsonObject.mxfile.diagram.mxGraphModel.root.mxCell as any[];
    // const elements = rootObjects;
    // const elementConnections = rootMxCells.concat(
    //   rootObjects.map((x) => {
    //     //HACK - могут перезаписаться аттрибуты
    //     const mxCell = JSON.parse(JSON.stringify(x.mxCell));
    //     Object.assign(mxCell._attributes, x._attributes);
    //     return mxCell;
    //   })
    // );
    // // .filter((x) => x._attributes.source !== undefined && x._attributes.target !== undefined);
    // const addNodeEvents = getAddNodeRequests(elements);
    // await Promise.all(addNodeEvents.map((x) => new AddNodeRequestHandler().handle({ app, event: x })));
    // const externalIdToNodeGuidMap = {} as any;
    // Object.values(app.nodes).forEach((node) => {
    //   const nodeState = node.getState();
    //   if (nodeState.priv.externalId !== undefined)
    //     externalIdToNodeGuidMap[nodeState.priv.externalId] = nodeState.meta.guid;
    // });
    // const addBindingEvents = getAddBindingRequests(externalIdToNodeGuidMap, elementConnections);
    // await Promise.all(addBindingEvents.map((x) => new AddBindingRequestHandler().handle({ app, event: x })));
    // const bindings = Object.values(app.bindings);
    // const nodesWithoutBindings = Object.values(app.nodes)
    //   .filter(
    //     (node) =>
    //       bindings.find(
    //         (binding) =>
    //           binding.from.node === node.getState().meta.guid ||
    //           binding.to.node === node.getState().meta.guid
    //       ) === undefined
    //   )
    //   .map((node) => new DeleteNodeRequest(node.getState().meta.guid));
    // await Promise.all(nodesWithoutBindings.map((x) => new DeleteNodeRequestHandler().handle({ app, event: x })));
  }
}
