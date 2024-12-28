import { dia } from "@joint/core";

export const NodeElement = dia.Element.define(
  "NodeElement",
  {
    attrs: {
      body: {
        width: "calc(w)",
        height: "calc(h)",
        strokeWidth: 2,
        stroke: "black",
        fill: "white",
      },
      type: {
        textVerticalAnchor: "top",
        textAnchor: "start",
        x: 4,
        y: 4,
        fontSize: 20,
        fill: "lightgrey",
      },
      name: {
        textVerticalAnchor: "middle",
        textAnchor: "middle",
        x: "calc(0.5*w)",
        y: "calc(0.5*h)",
        fontSize: 14,
        fill: "black",
      },
    },
  },
  {
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "text", selector: "type" },
      { tagName: "text", selector: "name" },
    ],
  }
);
