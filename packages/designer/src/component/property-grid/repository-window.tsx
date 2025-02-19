import WinBox from "react-winbox";
import { AddRepositoryItemsRequest } from "@d3s/event";
import { useAppSelector } from "../../app/hooks";
import { socketClient } from "../../service/socket-client-service";
import { RepositoryItemView } from "./repository-item-view";
import { useState } from "react";

export const RepositoryWindow = () => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const repository = useAppSelector((state) => state.network.network.repository);
  const categories = [...new Set(Object.values(repository).map((x) => x.category))];
  const selectedCategory = categories[selectedCategoryIndex];

  const items = Object.values(repository)
    .filter((x) => x.category === selectedCategory)
    .map((x) => <RepositoryItemView key={x.uri} {...x} />);

  function addNodes() {
    const list = prompt("node uris");
    if (list !== null) {
      const nodeUris = list.split("\n").map((x) => x.trim());
      socketClient.send(new AddRepositoryItemsRequest(nodeUris));
    }
  }

  const categoryTabs = categories.map((category, i) => (
    <button
      style={
        i === selectedCategoryIndex
          ? { backgroundColor: "black", color: "white" }
          : { backgroundColor: "white", color: "black" }
      }
      key={category}
      onClick={() => {
        setSelectedCategoryIndex(i);
      }}
    >
      {category}
    </button>
  ));

  return (
    <WinBox
      x={100}
      y={400}
      width={window.screen.width - 200}
      height={320}
      background="grey"
      title="Repository"
      min={true}
      noFull
      noClose
      noMax
    >
      <div>
        <button
          style={{
            marginLeft: "1%",
            borderRadius: 0,
            border: "1px solid lightgrey",
            padding: "0px 18px 0px 18px",
            fontSize: "x-small",
            verticalAlign: "middle",
            color: "black",
          }}
          onClick={addNodes}
        >
          add
        </button>
      </div>
      <div style={{ padding: "4px" }}>{categoryTabs}</div>
      <div style={{ marginTop: "12px", height: "220px", overflow: "auto" }}>{items}</div>
    </WinBox>
  );
};
