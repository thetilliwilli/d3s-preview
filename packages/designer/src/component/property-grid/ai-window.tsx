import WinBox from "react-winbox";
import { socketClient } from "../../service/socket-client-service";
import { useState } from "react";
import { AddAiNodeRequest } from "@d3s/event";

export const AiWindow = () => {
  const [prompt, setPrompt] = useState("");

  function addAiNode() {
    console.log(`+ai node: ${prompt}`);

    socketClient.send(new AddAiNodeRequest(prompt));
  }

  return (
    <WinBox width={500} x="left" height="100%" background="grey" title="AI" min={true}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(event: any) => {
          event.stopPropagation();
        }}
      />
      <div>
        <button onClick={addAiNode}>+aiNode</button>
      </div>
    </WinBox>
  );
};
