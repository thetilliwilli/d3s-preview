import { NodeBuilder } from "@d3s/runtime";
import http from 'node:http';
import { Buffer } from 'node:buffer';

export const ollama = new NodeBuilder()
  .withInput({
    url: "",
    model: "",
    prompt: "",
    ask: null
  })
  .withOutput({
    result: "",
    error: "",
    details: {} as any,
    finished: null,
  })
  .withHandlers({
    async ask({ input, emit }) {
      try {
        const responseText = await sendLongRequest(input);

        const resultChunks = responseText.split("\n").filter(x => x.trim() !== "").map(x => JSON.parse(x));
        const result = resultChunks.map(x => x.response).join("");
        const details = resultChunks.find(x => x.done === true);

        emit("result", result);
        emit("details", details);
      } catch (error) {
        emit("error", error + "");
      }

      emit("finished", null);
    },
  });




function sendLongRequest(input: any): Promise<string> {

  const postData = JSON.stringify({
    "model": input.model,
    "prompt": input.prompt
  });

  const parsedUrl = new URL(input.url);

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {

    const req = http.request(options, (res) => {

      if (res.statusCode !== 200)
        return reject(new Error(`${res.statusCode}: ${res.statusMessage}`))

      res.setEncoding('utf8');
      let data = "";
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.setTimeout(30 * 60 * 1000, reject); //30 минут

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });

}