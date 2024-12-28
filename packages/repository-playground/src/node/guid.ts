import { NodeBuilder } from "@d3s/runtime";
import { v4 } from "uuid";

export const guid = new NodeBuilder()
  .withInput({
    new: null,
  })
  .withOutput({
    guid: "",
  })
  .withHandlers({
    new({ state, signal, emit }) {
      emit("guid", v4());
    },
  });
