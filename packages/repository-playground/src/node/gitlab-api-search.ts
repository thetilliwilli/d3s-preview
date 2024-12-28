import { NodeBuilder } from "@d3s/runtime";
import { GitlabService } from "../service/gitlab-service.js";

export const gitlabApiSearch = new NodeBuilder()
  .withInput({
    token: "",
    baseUrl: "",
    groupId: -1,
    query: "openapi: 3",
    search: null,
  })
  .withOutput({
    files: [] as any[],
  })
  .withHandlers({
    async search({ input, signal, emit }) {
      const files = await new GitlabService(input.token, input.baseUrl).search(input.groupId, input.query);
      emit("files", files);
    },
  });
