import { NodeBuilder } from "@d3s/runtime";
import { FlatObject } from "../domain/flat-object.js";

export const flatObject = new NodeBuilder()
    .withState({})
    .withInput((state) => ({
        obj: {} as any,
    }))
    .withOutput((state, input) => ({
        entries: [] as ([string, any])[],
    }))
    .withHandlers({
        obj({ state, input, signal, instance, emit }) {
            const flatObject = new FlatObject(input.obj);
            emit("entries", flatObject.entries());
        },
    });