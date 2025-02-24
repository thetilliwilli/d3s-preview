import { PropsWithChildren } from "react";

export function ViewTabButton(props: PropsWithChildren<{ onClick: () => void; name: string; active: boolean }>) {
  return (
    <button
      style={{
        flex: 1,
        marginLeft: "5%",
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
