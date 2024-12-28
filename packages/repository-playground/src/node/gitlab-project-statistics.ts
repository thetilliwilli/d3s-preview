import { NodeBuilder } from "@d3s/runtime";
import { GitlabService } from "../service/gitlab-service.js";

type ProjectInfo = {
  id: string;
  url: string;
  lastActivityAt: string;
  archived: boolean;
  lang: any;
};

function chunk<T>(arr: T[], size: number): T[][] {
  return arr.reduce((a, v) => (a.at(-1)!.push(v) % size || a.push([]), a), [[]] as T[][]);
}

const parallelRequestLimit = 40;

export const gitlabProjectStatistics = new NodeBuilder()
  .withInput({
    token: "",
    gitlabUrl: "",
    limit: 20,
    getStats: null,
  })
  .withOutput({
    stats: [] as ProjectInfo[],
    done: null,
  })
  .withHandlers({
    async getStats({ input, signal, emit }) {
      const gitlab = new GitlabService(input.token, input.gitlabUrl);
      try {
        var projects = await gitlab.getProjects(input.limit);
      } catch (error) {
        console.error(error);
        throw error;
      }
      const taskRunners = projects.map((project) => async () => {
        const languages = await gitlab.getProjectLanguages(project.id);
        return {
          id: project.id,
          url: project.web_url,
          lastActivityAt: project.last_activity_at,
          archived: project.archived,
          lang: languages,
        };
      });

      const chunkedTaskRunners = chunk(taskRunners, parallelRequestLimit);

      const projectInfos = [] as ProjectInfo[];
      for (const chunk of chunkedTaskRunners) {
        const chunkResult = await Promise.all(chunk.map((x) => x()));
        projectInfos.push(...chunkResult);
      }

      emit("stats", projectInfos);
      emit("done", null);
    },
  });
