import { JsonSchema } from "./json-schema";

export type RuntimeProperty = {
  value: any;
  schema: JsonSchema;
};
