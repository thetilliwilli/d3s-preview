import { NodeBuilder } from "@d3s/runtime";
import exceljs from "exceljs";
import { FlatObject } from "../domain/flat-object.js";

export const jsonToXlsx = new NodeBuilder()
  .withInput({
    file: "book.xlsx",
    items: [] as any[][],
    run: null,
  })
  .withOutput({
    done: null,
  })
  .withHandlers({
    async run({ input, signal, emit }) {
      const workbook = new exceljs.Workbook();
      const sheet = workbook.addWorksheet("Sheet1");

      const tableData = getTableData(input.items);

      sheet.addTable({
        name: "Table1",
        ref: "A1",
        headerRow: true,
        columns: tableData.columns,
        rows: tableData.rows,
      });

      await workbook.xlsx.writeFile(input.file);

      emit("done", null);
    },
  });

type TableData = {
  columns: { name: string }[];
  rows: any[][];
};

function getTableData(items: any[]): TableData {
  const firstItem = items[0];
  if (!firstItem)
    return {
      columns: [],
      rows: [],
    };

  const firstItemKeys = new FlatObject(firstItem).keys();
  const columns = firstItemKeys.map((key) => ({ name: key }));
  const rows = items
    .map((item) => Object.fromEntries(new FlatObject(item).entries()))
    .map((flatItem) => firstItemKeys.map((key) => flatItem[key]));

  return { columns, rows };
}
