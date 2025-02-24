import { PropsWithChildren } from "react";

export function ViewTabButton(props: PropsWithChildren<{ onClick: () => void; name: string; active: boolean }>) {
  return (
    <button
      style={{
        flex: 1,
        margin: "0 1% 0 1%",
        backgroundColor: props.active ? "dodgerblue" : "initial",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        borderWidth: "1px",
      }}
      onClick={props.onClick}
    >
      {props.name}
    </button>
  );
}
