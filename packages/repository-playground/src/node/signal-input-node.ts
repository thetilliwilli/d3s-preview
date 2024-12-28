import { NodeBuilder } from "@d3s/runtime";

const reader = Symbol("reader");

const signalInputNode = new NodeBuilder()
  // .withState({
  //   [reader]: undefined as ReadableStreamDefaultReader<Uint8Array> | undefined,
  // })
  .withInput((state) => ({
    app: "http://localhost:5000",
    nodeGuid: "",
    scope: "output",
    signal: "",
    login: "",
    password: "",
    listen: null,
    stop: null,
  }))
  .withOutput((state, input) => ({
    data: {} as any,
    signal: {} as any,
    listenStarted: null,
    listenStopped: null,
    error: "",
  }))
  .withHandlers({
    async listen({ state, input, signal, instance, emit }) {
      await instance[reader]?.cancel();

      const init = {
        method: "GET",
        keepaliv: "",
        headers: {
          Authorization: "Basic " + Buffer.from(input.login + ":" + input.password).toString("base64"),
        },
      };

      try {
        const response = await fetch(
          `${input.app}/channel/root/${input.nodeGuid}/${input.scope}/${input.signal}?dataOnly`,
          init
        );
        emit("listenStarted", null);
        if (response.body === null) return;
        instance[reader] = response.body.getReader();
        while (true) {
          const { done, value } = await instance[reader].read();
          if (done) {
            // Do something with last chunk of data then exit reader
            return;
          }
          const dataString = Buffer.from(value).toString("utf8");
          // обрезаем "data: "
          const data = JSON.parse(dataString.slice(6));
          emit("data", data);
        }
      } catch (e) {
        emit("error", e + "");
      } finally {
        emit("listenStopped", null);
      }
    },
    async stop({ instance }) {
      await instance[reader]?.cancel();
    },
  });

export { signalInputNode as signalInput };
