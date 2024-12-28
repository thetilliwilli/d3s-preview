import { NodeBuilder } from "@d3s/runtime";
import postgres from "postgres";
import util from "util";

type SimilarityLookup = {
  database: string;
  tables: string[];
};

type Similarity = {
  path: string;
  percent: number;
  totalCount: number;
  values: string[];
  sameCount: number;
};

export const databaseSimilarity = new NodeBuilder()
  .withInput({
    connection1: "",
    connection2: "",
    lookups: [] as SimilarityLookup[],
    includeValues: false,
    run: null,
  })
  .withOutput({
    result: [] as Similarity[],
    error: "",
  })
  .withHandlers({
    async run({ state, input, signal, instance, emit }) {
      try {
        const similarities: Similarity[] = [];

        for (const lookup of input.lookups) {
          const leftSql = postgres(`${input.connection1}/${lookup.database}`);
          const rightSql = postgres(`${input.connection2}/${lookup.database}`);

          for (const table of lookup.tables) {
            const items = await leftSql`select * from ${leftSql(table)}`;

            const firstItem = items[0];
            if (!firstItem) continue;

            const props = Object.entries(firstItem)
              .filter(([key, value]) => typeof value === "string")
              .map((x) => x[0])
              .map((prop) => ({
                name: prop,
                values: [...new Set(items.map((item) => item[prop]))],
              }));

            if (props.length === 0) continue;

            // ищем совпадения
            const testItems = await rightSql`select * from ${rightSql(table)}`;

            props.forEach((prop) => {
              const sameValues = new Set<string>();

              const testItemsFilter = testItems.filter((testItem) => {
                const valuesFiltered = prop.values.filter((value) => value === testItem[prop.name]);
                valuesFiltered.forEach((sameValue) => sameValues.add(sameValue));
                return valuesFiltered.length > 0;
              });

              const percent = Math.round((testItemsFilter.length / testItems.length) * 10000) / 100;

              const similarity = {
                path: `${lookup.database}.${table}.${prop.name}`,
                percent,
                totalCount: testItems.length,
                values: input.includeValues ? [...sameValues] : [],
                sameCount: sameValues.size,
              };

              similarities.push(similarity);
            });
          }

          await leftSql.end();
          await rightSql.end();
        }

        emit("result", similarities);
      } catch (error) {
        emit("error", util.inspect(error));
      }
    },
  });
