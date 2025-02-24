import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { uiSlice } from "../../slice/ui-slice";
import { RepositoryItemView } from "../property-grid/repository-item-view";
import { socketClient } from "../../service/socket-client-service";
import { AddAiNodeRequest } from "@d3s/event";

const textSize = 14;
const aiButtonOriginalText = "AI";
const aiButtonGenerationText = "AI...";

function calcHeight(n: number) {
  return (n + 0.5) * textSize + textSize;
}

export const OmniboxComponent = () => {
  const dispatch = useAppDispatch();
  const showOmnibox = useAppSelector((state) => state.ui.showOmnibox);
  const repository = useAppSelector((state) => state.network.network.repository);

  const [textareaHeight, setTextareaHeight] = useState(calcHeight(1));
  const [search, setSearch] = useState("");
  const [isAiGeneration, setIsAiGeneration] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [showOmnibox]);

  if (!showOmnibox) return null;

  const searchTrimmed = search.trim();
  const items =
    searchTrimmed === ""
      ? []
      : Object.values(repository)
          .filter((x) => [x.uri].join("").includes(searchTrimmed))
          .map((x) => <RepositoryItemView key={x.uri} {...x} />);

  return (
    <div
      style={{
        position: "fixed",
        left: window.innerWidth / 4,
        top: window.innerHeight / 4,
        width: window.innerWidth / 2,
        display: showOmnibox ? "initial" : "none",
        boxShadow: "0px 0px 30px 5px white",
      }}
    >
      <div style={{ display: "flex" }}>
        <textarea
          id="omnibox"
          ref={textareaRef}
          style={{
            flex: 11,
            width: "100%",
            borderRadius: 0,
            borderColor:"dodgerblue",
            fontSize: `${textSize}px`,
            height: `${textareaHeight}px`,
            resize: "none",
            outline: "none",
          }}
          onKeyDown={(e) => {
            e.stopPropagation();

            if (e.code === "Escape") dispatch(uiSlice.actions.hideOmnibox());
          }}
          value={search}
          placeholder="> найти или сгенерировать AI нод"
          onChange={(e) => {
            const height = calcHeight(e.target.value.split("\n").length);
            setTextareaHeight(height);
            setSearch(e.target.value);
          }}
        />
        {searchTrimmed !== "" && items.length === 0 && (
          <button
            style={{
              flex: 1,
              borderRadius: 0,
              border: "1px solid dodgerblue",
              color: "dodgerblue",
              background: isAiGeneration
                ? "center / contain no-repeat url(circular_progress_indicator_selective.gif)"
                : "white",
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.backgroundColor = "dodgerblue";
              e.currentTarget.style.color = "white";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.color = "dodgerblue";
            }}
            title="Сгенерировать с помощью ИИ"
            onClick={async (e) => {
              const prompt = search;
              setIsAiGeneration(true);
              let timer: ReturnType<typeof setInterval> | undefined = undefined;
              try {
                timer = setInterval(() => {
                  const seconds = new Date().getSeconds();
                  e.currentTarget.innerText = aiButtonGenerationText.slice(
                    0,
                    (seconds % aiButtonGenerationText.length) + 1
                  );
                }, 1000);

                const response = await socketClient.sendWait(new AddAiNodeRequest(prompt));
                console.log("ai result:", response);
              } finally {
                clearInterval(timer);
                setIsAiGeneration(false);
              }
            }}
          >
            {aiButtonOriginalText}
          </button>
        )}
      </div>
      {items.length > 0 && (
        <div
          style={{
            overflow: "auto",
            height: "50%",
            backgroundColor: "rgb(227, 229, 237)",
            backgroundImage: "radial-gradient(black 0.5px, transparent 0)",
            backgroundSize: "10px 10px",
          }}
        >
          <div style={{ margin: "0px auto 0px auto", width: "80%" }}>{items}</div>
        </div>
      )}
      {isAiGeneration && <div>отправлен запрос на генерацию ИИ нода</div>}
    </div>
  );
};
