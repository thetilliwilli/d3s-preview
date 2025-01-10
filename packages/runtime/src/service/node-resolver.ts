import { Dictionary } from "@d3s/utils";
import { NodeBuilder } from "../domain/node/node-builder.js";

export class NodeResolver {
  public async resolve(nodeUri: string): Promise<NodeBuilder> {
    const parsedNodeUri = this.parseNodeUri(nodeUri);

    // HACK перевроверить как сделать путь относительно __filename vs config.repo
    // const require = createRequire(config.repo === undefined ? __filename : config.repo);

    const repository = (await import(parsedNodeUri.repository)) as Dictionary<NodeBuilder>;

    const nodeBuilder = repository[parsedNodeUri.nodeId];

    return nodeBuilder;
  }

  private parseNodeUri(nodeUri: string) {
    return {
      repository: nodeUri.split(".")[0],
      nodeId: nodeUri.split(".")[1],
    };
  }
}
