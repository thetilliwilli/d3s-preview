import { NodeBuilder } from "@d3s/runtime";
import AdmZip from "adm-zip";
import { LangStat } from "../domain/lang-stat.js";
import { gitlabLangStatsXlsxTemplate } from "../resource/gitlab-lang-stats-xlsx-template.js";

type DataItem = [lang: string, percents: number, url: string, lastActivityAt: string, archived: boolean];

export const gitlabLangStatsReport = new NodeBuilder()
  .withInput({
    langStats: [] as LangStat[],
    outFile: "",
    run: null,
  })
  .withOutput({
    done: null,
  })
  .withHandlers({
    run({ input, signal, emit }) {
      const items: DataItem[] = input.langStats.map(x => [x.lang, x.percents, x.project.url, x.project.lastActivityAt, x.project.archived]);
      const newDimensionRef = `A1:E${items.length + 1}`;

      //#region -----STEP (unpack xlsx)-----
      const zip = new AdmZip(Buffer.from(gitlabLangStatsXlsxTemplate, "base64"));
      const entries = zip.getEntries();
      //#endregion

      //#region -----STEP (change data)-----

      // changing sheet data
      const sheet1ZipEntry = entries.find((x: any) => x.entryName === "xl/worksheets/sheet1.xml");
      const sheet1Content = sheet1ZipEntry.getData().toString("utf8");
      const [beforeSheetDataEnd, afterSheetDataEnd] = sheet1Content.split("</sheetData>");
      const newRows = items.map((item, index) => dataItemToXmlElement(item, 2 + index));
      const newRowsContent = newRows.join("\n");

      const sheet1ContentUpdated = [beforeSheetDataEnd, newRowsContent, "</sheetData>", afterSheetDataEnd]
        .join("")
        .replace(`<dimension ref="A1:E1"/>`, `<dimension ref="${newDimensionRef}"/>`);

      sheet1ZipEntry.setData(sheet1ContentUpdated);

      // changing table data
      const table1ZipEntry = entries.find((x: any) => x.entryName === "xl/tables/table1.xml");
      const table1Content = table1ZipEntry.getData().toString("utf8");
      const table1ContentUpdated = table1Content.replaceAll(`ref="A1:E2"`, `ref="${newDimensionRef}"`);
      table1ZipEntry.setData(table1ContentUpdated);
      //#endregion

      //#region -----STEP (pack back)-----
      zip.writeZip(input.outFile);
      //#endregion

      emit("done", null);
    },
  });


function dataItemToXmlElement(dataItem: DataItem, rowIndex: number /* должен начать с 2 потому что r=1 принадлежит хедеру */) {
  return `<row r="${rowIndex}" spans="1:5" x14ac:dyDescent="0.25">
            <c r="A${rowIndex}" t="inlineStr">
                <is><t>${dataItem[0]}</t></is>
            </c>
            <c r="B${rowIndex}" t="n">
                <v>${dataItem[1]}</v>
            </c>
            <c r="C${rowIndex}" t="inlineStr">
                <is><t>${dataItem[2]}</t></is>
            </c>
            <c r="D${rowIndex}" t="inlineStr">
                <is><t>${dataItem[3]}</t></is>
            </c>
            <c r="E${rowIndex}" t="b">
                <v>${+dataItem[4]}</v>
            </c>
        </row>`;
}