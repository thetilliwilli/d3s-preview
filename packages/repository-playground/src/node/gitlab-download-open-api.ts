import { NodeBuilder } from "@d3s/runtime";
import fs from "fs";
import { convert } from "openapi-to-postmanv2";
import path from "path";
import { CollectionDefinition, PropertyBaseDefinition } from "postman-collection";
import { GitlabService } from "../service/gitlab-service.js";

export const gitlabDownloadOpenApi = new NodeBuilder()
  .withInput({
    token: "",
    gitlabUrl: "",
    groupId: -1,
    outDir: "collections",
    filterQuery: "openapi: 3",
    download: null,
  })
  .withOutput({
    fileCount: 0,
    files: [] as string[],
    errors: [] as string[],
    finished: null,
  })
  .withHandlers({
    async download({ input, signal, emit }) {
      const errors = [] as string[];
      const files = [] as string[];

      const outDirSource = path.posix.join(input.outDir, "source");
      const outDirConverted = path.posix.join(input.outDir, "converted");
      const outDirPrepared = path.posix.join(input.outDir, "prepared");

      [outDirSource, outDirConverted, outDirPrepared].forEach((dirName) => fs.mkdirSync(dirName, { recursive: true }));

      const gitlab = new GitlabService(input.token, input.gitlabUrl);

      const gitlabFiles = await gitlab.search(input.groupId, input.filterQuery);

      let foundFiles = [];
      for (const file of gitlabFiles) {
        const [content, project] = await Promise.all([
          gitlab.getFile(file.project_id, file.path, file.ref),
          gitlab.getProject(file.project_id),
        ]);
        foundFiles.push({
          content,
          projectId: file.project_id,
          projectWebUrl: project.web_url,
          path: file.path,
          ref: file.ref,
          filename: file.filename,
        });
      }

      foundFiles = foundFiles.filter((x) => {
        const extname = path.extname(x.path);
        return extname === ".json" || extname === ".yml" || extname === ".yaml";
      });

      emit("fileCount", foundFiles.length);

      if (foundFiles.length === 0) {
        emit("errors", []);
        emit("files", []);
        emit("finished", null);
        return;
      }

      for (const foundFile of foundFiles) {
        const extname = path.extname(foundFile.path);
        if (extname !== ".json" && extname !== ".yml" && extname !== ".yaml") continue;
        const sourceFilename =
          foundFile.projectId +
          "_" +
          foundFile.path.slice(0, -extname.length || undefined).replace(/[^0-9a-zA-Z]/gim, "-") +
          extname;
        fs.writeFileSync(path.join(outDirSource, sourceFilename), foundFile.content);

        convert(
          { type: "string", data: foundFile.content },
          { folderStrategy: "Tags", includeAuthInfoInExample: false },
          (error, result) => {
            if (error) {
              errors.push(error + "");
            }
            if (!result.result) {
              errors.push(result.reason);
            } else {
              const collection = result.output[0].data;

              const outFilename =
                [collection.info?.name || "xxxx", foundFile.path, foundFile.projectId + "", foundFile.ref]
                  .map((x) => x.replace(/[^0-9a-zA-Z]/gim, "-"))
                  .join(".") + ".json";

              //hack: мега хак потому что у обеих пакетов: openapi-to-postmanv2, postman-collection кривой type definition
              const collectionInfo = collection.info as CollectionDefinition["info"] & PropertyBaseDefinition;

              const infoDescription = collectionInfo.description;

              const originalDescription =
                typeof infoDescription === "string"
                  ? infoDescription
                  : infoDescription === undefined
                  ? ""
                  : infoDescription.content;

              const source =
                foundFile.projectWebUrl + "/-/blob/" + foundFile.ref + "/" + encodeURIComponent(foundFile.filename);

              //hack: мега хак потому что у обеих пакетов: openapi-to-postmanv2, postman-collection кривой type definition
              collectionInfo.description = {
                type: "text/markdown",
                content: `${originalDescription}\n${source}`.trim(),
              };

              const jsonString = JSON.stringify(collection);
              const filePath = path.resolve(outDirConverted, outFilename);
              fs.writeFileSync(filePath, jsonString);
              files.push(filePath);
            }

            if (files.length + errors.length >= foundFiles.length) {
              emit("errors", errors);
              emit("files", files);
              emit("finished", null);
            }
          }
        );
      }
    },
  });
