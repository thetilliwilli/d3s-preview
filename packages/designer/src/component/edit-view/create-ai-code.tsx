import { GenerateAiCodeRequest, SendSignalRequest } from "@d3s/event";
import { useState } from "react";
import { EditViewWindowOptions } from "../../domain/edit-view-window-options";
import { socketClient } from "../../service/socket-client-service";

export function CreateAiCode(props: { options: EditViewWindowOptions, onCodeGenerated:(options:EditViewWindowOptions)=>void }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <div>
        <textarea
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          style={{ width: "100%" }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="введите запрос для генерации кода"
        ></textarea>
      </div>
      {prompt.trim() !== "" && (
        <div>
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const response = await socketClient.sendWait(new GenerateAiCodeRequest(prompt, "html"));
                console.log("aicodegen.result:", response);
                if (response.error) setError(response.error);
                else {
                  let code = response.result;
                  code = `/*@view*/${code}`;
                  await socketClient.send(
                    new SendSignalRequest(props.options.nodeGuid, props.options.name, code, "input")
                  );
                }
              } finally {
                setIsLoading(false);
              }
            }}
            style={{
              marginLeft: "1%",
              borderRadius: 0,
              verticalAlign: "middle",
              border: "1px solid dodgerblue",
              color: "dodgerblue",
              background: isLoading
                ? "center / contain no-repeat url(circular_progress_indicator_selective.gif)"
                : "none",
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.backgroundColor = "dodgerblue";
              e.currentTarget.style.color = "white";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.color = "dodgerblue";
            }}
          >
            aigen
          </button>
          <span>{isLoading ? " генерируем код. подождите..." : ""}</span>
          <span style={{ backgroundColor: "lightcoral" }}>{error ? `ошибка:${error}` : ""}</span>
        </div>
      )}
    </div>
  );
}
