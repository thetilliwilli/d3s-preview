import { PropsWithChildren } from "react";

export function ViewTabButton(props: PropsWithChildren<{ onClick: () => void; name: string; active: boolean }>) {
  return (
    <button
      style={{
        marginLeft: "5%",
        backgroundColor: props.active ? "dodgerblue" : "initial",
      }}
      onClick={props.onClick}
    >
      {props.name}
    </button>
  );
}
