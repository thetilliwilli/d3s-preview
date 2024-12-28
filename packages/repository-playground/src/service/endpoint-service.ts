import fs from "fs";
import path from "path";
import util from "util";
import { Endpoint } from "../domain/endpoint.js";

export type ActionContext = {
  pipe: string;
  name: string;
  cache: boolean;
  action: (endpoints: Endpoint[]) => Promise<Endpoint[]>;
  emit: (name: any, data: any) => void;
};

export type VarTuple = {
  [key: string]: string;
};

const vars = {
  prefix: "{{",
  suffix: "}}",
};

class EndpointService {
  public baseDir = "scanner";
  public endpointsDir = "ednpoints";

  public getPipe(name: string): string {
    return path.posix.join(this.baseDir, name);
  }

  public async actionOnEdnpoints({ name, pipe, cache, action, emit }: ActionContext) {
    try {
      const inputEnpoints = this.getEndpoints(pipe);
      const outputPipe = this.getPipe(`${this.endpointsDir}/${name}`);

      fs.mkdirSync(path.dirname(outputPipe), { recursive: true });

      let outputEndpoints =
        cache && fs.existsSync(outputPipe) ? this.loadEndpoints(outputPipe) : await action(inputEnpoints);

      if (cache === false || fs.existsSync(outputPipe) === false)
        fs.writeFileSync(outputPipe, JSON.stringify(outputEndpoints));

      emit("size", outputEndpoints.length);
      emit("pipe", outputPipe);
    } catch (error) {
      emit("error", util.inspect(error));
    }
  }

  public replaceVars(originalEndpoint: Endpoint, varTuples: VarTuple[]) {
    const injectedEndpoints = varTuples.map((varTuple) => {
      let newUrl = originalEndpoint.url;

      for (const key in varTuple) newUrl = newUrl.replaceAll(`${vars.prefix}${key}${vars.suffix}`, varTuple[key]);

      const newEndpoint = new Endpoint(originalEndpoint);
      newEndpoint.url = newUrl;

      return newEndpoint;
    });

    return injectedEndpoints;
  }

  public getEndpoints(pipe: string) {
    const pipes = Array.isArray(pipe) ? pipe : [pipe];

    const endpoints = pipes.filter((x) => fs.existsSync(x)).flatMap((pipe) => this.loadEndpoints(pipe));

    return endpoints;
  }

  public getPipes(inputPipe: string): string[] {
    const inputPipePathStat = fs.statSync(inputPipe);

    const outputPipes = inputPipePathStat.isDirectory()
      ? fs
          // @ts-ignore typescript не корректно отображает сигнатуру readdirSync, отсуствует recursive:true
          .readdirSync(inputPipe, { recursive: true, withFileTypes: true })
          .filter((x: fs.Dirent) => x.isFile())
          // @ts-ignore typescript не корректно отображает сигнатуру fs.Dirent
          .map((x) => path.posix.join(x.path, x.name))
      : [inputPipe];

    return outputPipes;
  }

  private loadEndpoints(pipe: string): Endpoint[] {
    return JSON.parse(fs.readFileSync(pipe, "utf8")).map((x: any) => new Endpoint(x));
  }
}

export const endpointService = new EndpointService();
