enum ValueType {
  Null = "null",
  Boolean = "boolean",
  Integer = "integer",
  Number = "number",
  String = "string",
  Object = "object",
  Array = "array",
}

/**
 * сделано по аналогии с JsonSchema из npm package'a "genson-js"
 * node_modules\genson-js\dist\types.d.ts
 * todo: необходимо вынести в "core" и сослаться здесь в двух модулях @d3s/state & @d3s/repository
 */
export type JsonSchemaState = {
  type?: ValueType | ValueType[];
  items?: JsonSchemaState;
  properties?: Record<string, JsonSchemaState>;
  required?: string[];
  anyOf?: Array<JsonSchemaState>;
};
