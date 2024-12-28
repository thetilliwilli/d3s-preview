import { NodeBuilder } from "@d3s/runtime";
import { DateTime } from "luxon";

export const datetime = new NodeBuilder()
  .withInput({
    base: DateTime.now().toISO(),
    startOfDay: false,
    endOfDay: false,
    addYears: 0,
    addMonths: 0,
    addDays: 0,
    addHours: 0,
    addMinutes: 0,
    addSeconds: 0,
    addMilliseconds: 0,
    now: null,
  })
  .withOutput({
    iso: "",
  })
  .withHandlers({
    base: calcDate,
    startOfDay: calcDate,
    endOfDay: calcDate,
    addYears: calcDate,
    addMonths: calcDate,
    addDays: calcDate,
    addHours: calcDate,
    addMinutes: calcDate,
    addSeconds: calcDate,
    addMilliseconds: calcDate,
    now: calcDate,
  });

function calcDate(ctx: any): void {
  const {
    base,
    startOfDay,
    endOfDay,
    addYears,
    addMonths,
    addDays,
    addHours,
    addMinutes,
    addSeconds,
    addMilliseconds,
  } = ctx.input;

  const baseNow = ctx.signal.name === "now" ? DateTime.now().toISO() : base;

  let datetime = DateTime.fromISO(baseNow).plus({
    years: addYears,
    months: addMonths,
    days: addDays,
    hours: addHours,
    minutes: addMinutes,
    seconds: addSeconds,
    milliseconds: addMilliseconds,
  });

  if (startOfDay) datetime = datetime.startOf("day");
  if (endOfDay) datetime = datetime.endOf("day");

  const iso = datetime.toISO();

  const result = iso === null ? baseNow : iso;

  ctx.emit("iso", result);
}
