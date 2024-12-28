import { useState } from "react";

interface ResourceImporterTileProps {
  title: string;
  description: string;
  onClick: () => void;
}

const styles: React.CSSProperties = {
  flex: 1,
  fontSize: "3em",
};

const descriptionStyles: React.CSSProperties = {
  color: "grey",
  visibility: "hidden",
};

export const ResourceImporterTile = (props: ResourceImporterTileProps) => {
  const [isSelected, setIsSelected] = useState(false);

  const runtimeStyles: React.CSSProperties = {
    ...styles,
    ...{ backgroundColor: isSelected ? "white" : "rgba(255,255,255,0.5)" },
    ...{ color: isSelected ? "black" : "grey" },
  };

  const runtimeDescriptionStyles: React.CSSProperties = {
    ...descriptionStyles,
    ...{ visibility: isSelected ? "visible" : "hidden" },
  };

  return (
    <div
      style={runtimeStyles}
      onClick={(_) => {
        props.onClick();
      }}
      onPointerEnter={(_) => {
        setIsSelected(true);
      }}
      onPointerLeave={(_) => {
        setIsSelected(false);
      }}
    >
      <h1>{props.title}</h1>
      <h3 style={runtimeDescriptionStyles}>{props.description}</h3>
    </div>
  );
};
