import { FlameSpan } from "../domain/flame-span/flame-span.js";
import { FocusSpan } from "../domain/flame-span/focus-span.js";
import { SuccessLog } from "../domain/log/success-log.js";
import { UnionLog } from "../domain/log/union-log.js";

const daySpanWidthMs = 86400000;
const hourCount = 24;
const defaultColor = "grey";
const tz = 3;

const colors: string[] = [];

const counts = {
  hue: 11,
  saturation: 3,
  lightness: 1,
};

const colorCounts = counts.hue * counts.saturation * counts.lightness;

for (let i = 0; i < colorCounts; ++i) {
  const h = (360 / counts.hue) * (i % counts.hue);
  const s = 100 / ((i % counts.saturation) + 1);
  const l = 50 / ((i % counts.lightness) + 1);
  colors[i] = "hsl(" + h + ", " + s + "%, " + l + "%)";
}

function getColorByIndex(i: number) {
  return colors[i];
}

function getRootSpan(startOfTheDay: number): FlameSpan {
  return {
    name: "wholeDay: " + new Date(startOfTheDay).toISOString().split("T")[0],
    id: "wholeDay",
    value: daySpanWidthMs,
    color: "slategrey",
    x: 0,
    low: 0,
    high: daySpanWidthMs,
    custom: {
      spanId: "wholeDay",
      processId: "-",
      processName: "-",
      windowTitle: "-",
      start: startOfTheDay,
      end: startOfTheDay + daySpanWidthMs,
      startTime: new Date(startOfTheDay).toISOString().split("T")[0],
      endTime: new Date(startOfTheDay + daySpanWidthMs - 1)
        .toISOString()
        .split("T")[0],
      duration: (daySpanWidthMs / (1000 * 60)).toFixed(2),
    },
  };
}

function createHourFlameSpans() {
  const hourFlameSpans: FlameSpan[] = [...".".repeat(hourCount)].map((_, i) => {
    const width = daySpanWidthMs / hourCount;

    const start = i * width;
    const end = start + width;

    const startTime = new Date(start).toISOString().slice(11, -5);
    const endTime = new Date(end).toISOString().slice(11, -5);
    const duration = ((end - start) / (1000 * 60)).toFixed(2);

    return {
      name: `${i}h`,
      id: i + "",
      value: width,
      color: "crimson",
      x: -1,
      low: start,
      high: end,
      custom: {
        spanId: "",
        processId: "",
        processName: "",
        windowTitle: "",
        start: start,
        end: end,
        startTime,
        endTime,
        duration,
      },
    };
  });

  return hourFlameSpans;
}

function getActiveHoursSpan(flameSpans: FlameSpan[]): FlameSpan {
  const first = flameSpans[0];
  const last = flameSpans[flameSpans.length - 1];
  return {
    name: "activeTime",
    id: "activeTime",
    value: last.high - first.low,
    color: "royalblue",
    x: -2,
    low: first.low,
    high: last.high,
    custom: {
      spanId: "activeTime",
      processId: "-",
      processName: "-",
      windowTitle: "-",
      start: first.custom.start,
      end: last.custom.end,
      startTime: first.custom.startTime,
      endTime: last.custom.endTime,
      duration: ((last.custom.end - first.custom.start) / (1000 * 60)).toFixed(
        2
      ),
    },
  };
}

function toFocusSpan(log: SuccessLog) {
  return {
    spanId: `${log.processName}${log.appTitle}`,
    processId: log.id,
    processName: log.processName,
    windowTitle: log.appTitle,
    start: log.time,
    end: log.time,
    startTime: "",
    endTime: "",
    duration: "",
  };
}

/**
 * @param startOfTheDay старт дня, например 2023-11-15T00:00:00.000Z
 */
function toFlameSpan(span: FocusSpan, startOfTheDay: number): FlameSpan {
  const low = span.start - startOfTheDay;
  const spanWidth = span.end - span.start;
  const high = low + spanWidth;

  const result = {
    name: span.processName, //'a.objectEach',
    id: span.start + "", //'25',
    value: spanWidth, // width of span
    color: defaultColor, //colors[0],
    x: -3, //-15,
    low: low, //65924,
    high: high, //82340
    custom: span,
  };

  //to timezone
  const tzOffset = tz * 3600 * 1000;

  result.low += tzOffset;
  result.high += tzOffset;
  result.custom.start += tzOffset;
  result.custom.end += tzOffset;
  result.custom.startTime = new Date(result.custom.start)
    .toISOString()
    .slice(11, -5);
  result.custom.endTime = new Date(result.custom.end)
    .toISOString()
    .slice(11, -5);

  return result;
}

function toSuccessLog(x: UnionLog): x is SuccessLog {
  return !("error" in x);
}

export function toFlameSpans(
  minSpanWidth: number,
  logs: UnionLog[]
): FlameSpan[] {
  const successLogs = logs.filter(toSuccessLog);

  const spans = [];

  let span = toFocusSpan(successLogs[0]);

  for (const successLog of successLogs) {
    const iterationSpan = toFocusSpan(successLog);

    if (span.spanId === iterationSpan.spanId) {
      span.end = successLog.time;
    } else {
      spans.push(span);
      span = iterationSpan;
    }

    const startTime = new Date(span.start).toISOString().slice(11, -5);
    const endTime = new Date(span.end).toISOString().slice(11, -5);
    const duration = ((span.end - span.start) / (1000 * 60)).toFixed(2);

    span.startTime = startTime;
    span.endTime = endTime;
    span.duration = duration;
  }

  const minTime = spans[0].start;
  const startOfTheDay = new Date(
    new Date(minTime).toISOString().split("T")[0]
  ).getTime();
  const processNames = [...new Set(spans.map((x) => x.processName))];

  const flameSpans = spans
    .map((x) => toFlameSpan(x, startOfTheDay))
    .filter((x) => x.value > minSpanWidth)
    .map((x) => {
      var colorIndex = processNames.findIndex(
        (id) => id === x.custom.processName
      );
      if (colorIndex !== -1) x.color = getColorByIndex(colorIndex);
      return x;
    });

  const wholeDaySpan = getRootSpan(startOfTheDay);
  const hourSpans = createHourFlameSpans();
  const activeTimeSpan = getActiveHoursSpan(flameSpans);

  const result = ([] as FlameSpan[])
    .concat(flameSpans)
    .concat(activeTimeSpan)
    .concat(hourSpans)
    .concat(wholeDaySpan);

  return result;
}

export class FlameChartService {
  public static getFlameSpans(
    minSpanWidth: number,
    logs: UnionLog[]
  ): FlameSpan[] {
    return toFlameSpans(minSpanWidth, logs);
  }
}
