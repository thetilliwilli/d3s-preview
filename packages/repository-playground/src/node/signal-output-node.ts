import { SendSignalRequest } from "@d3s/event";
import { NodeBuilder } from "@d3s/runtime";

const signalOutputNode = new NodeBuilder()
  .withInput((state) => ({
    app: "http://localhost:5000",
    nodeGuid: "",
    signal: "",
    data: {} as any,
    login: "",
    password: "",
    send: null,
  }))
  .withOutput((state, input) => ({
    sent: null,
    error: "",
  }))
  .withHandlers({
    async send({ state, input, signal, emit }) {
      const init = {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(input.login + ":" + input.password).toString("base64"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(new SendSignalRequest(input.nodeGuid, input.signal, input.data, "input")),
      };

      const result = await fetch(`${input.app}`, init)
        .then((x) => x.json())
        .catch((error) => ({ error: error + "" }));

      if (result.error) {
        emit("error", result.error);
      } else {
        emit("sent", null);
      }
    },
  });

export { signalOutputNode as signalOutput };
