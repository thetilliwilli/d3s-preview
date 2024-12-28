export class GitlabService {
  constructor(private token: string, private baseUrl: string) {}

  public async search(groupId: number, query: string) {
    // найдет все версии openapi: 3.x.x - других версий openapi у нас нет
    // двойные кавычки, чтобы gitlab делал exact search
    const encodedQuery = encodeURIComponent(`"${query}"`);
    const nextPage = 1;
    const perPage = 100;
    const url = `${this.baseUrl}/api/v4/groups/${groupId}/search?scope=blobs&search=${encodedQuery}&per_page=${perPage}&page=${nextPage}`;
    const result = await fetch(url, {
      headers: {
        "PRIVATE-TOKEN": this.token,
      },
    });
    return result.json();
  }

  public async getFile(projectId: number, path: string, ref: string) {
    const encodedPath = encodeURIComponent(path);
    const url = `${this.baseUrl}/api/v4/projects/${projectId}/repository/files/${encodedPath}/raw?ref=${ref}`;
    const result = await fetch(url, {
      headers: {
        "PRIVATE-TOKEN": this.token,
      },
    });
    return result.text();
  }

  public async getProject(projectId: number) {
    const url = `${this.baseUrl}/api/v4/projects/${projectId}`;
    const result = await fetch(url, {
      headers: {
        "PRIVATE-TOKEN": this.token,
      },
    });
    return result.json();
  }

  public async getProjectLanguages(projectId: number) {
    const url = `${this.baseUrl}/api/v4/projects/${projectId}/languages`;
    const result = await fetch(url, {
      headers: {
        "PRIVATE-TOKEN": this.token,
      },
    });
    return result.json();
  }

  /** https://docs.gitlab.com/ee/api/rest/index.html#keyset-based-pagination */
  public async getProjects(limit: number = 100) {
    const projects = [];

    let link: string | null = `${this.baseUrl}/api/v4/projects?pagination=keyset&per_page=100&order_by=id&sort=asc`;

    while (link && projects.length < limit) {
      const response = await fetch(link, {
        signal: AbortSignal.timeout(300000),
        headers: {
          "PRIVATE-TOKEN": this.token,
        },
      });

      const partialProjects = await response.json();
      projects.push(...partialProjects);

      // пример заголовка Link: <https://gitlab.example.com/api/v4/projects?pagination=keyset&per_page=50&order_by=id&sort=asc&id_after=42>; rel="next"
      link = (response.headers.get("link") || "").slice(1, -13);
    }

    return projects.slice(0, limit);
  }

  public async getTree(
    projectId: number,
    path: string
  ): Promise<
    {
      id: string;
      path: string;
      type: "blob" | "tree";
    }[]
  > {
    const result = [];
    let page = 1;

    const baseUrl = `${this.baseUrl}/api/v4/projects/${projectId}/repository/tree?path=${path}`;

    const requestInit = {
      headers: {
        "PRIVATE-TOKEN": this.token,
      },
    };

    while (true) {
      const paginatedUrl = `${baseUrl}&per_page=100&page=${page}`;
      const response = await fetch(paginatedUrl, requestInit);
      const pageResult = await response.json();
      result.push(...pageResult);
      if (response.headers.get("X-Next-Page")?.trim() === "") break;
      page++;
    }

    return result;
  }
}
