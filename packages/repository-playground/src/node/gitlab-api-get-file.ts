import { NodeBuilder } from "@d3s/runtime";
import { GitlabService } from "../service/gitlab-service.js";

export const gitlabApiGetFile = new NodeBuilder()
  .withInput({
    token: "",
    baseUrl: "",
    projectId: -1,
    path: "",
    ref: "",
    get: null,
  })
  .withOutput({
    content: "",
    finished: null,
  })
  .withHandlers({
    async get({ input, signal, emit }) {
      const content = await new GitlabService(input.token, input.baseUrl).getFile(
        input.projectId,
        input.path,
        input.ref
      );
      emit("content", content);
      emit("finished", null);
    },
  });
