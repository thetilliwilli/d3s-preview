import { GenerateAiCodeRequest } from "@d3s/event";
import { AbstractRequestHandler } from "./abstract-request-handler.js";
import { AbstractRequestHandlerContext } from "./app-event-request-handler.js";

export class GenerateAiCodeRequestHandler implements AbstractRequestHandler<GenerateAiCodeRequest, any> {
  public async handle({ app, event }: AbstractRequestHandlerContext<GenerateAiCodeRequest>): Promise<any> {
    let code = await app.promptAiCode(event.prompt, event.language);
    if (event.language === "html") code = `<!-- ${event.prompt} -->\n${code}`;
    if (event.language === "javascript") code = `/* ${event.prompt} */\n${code}`;
    console.log(event.language, code);
    return code;
  }
}
