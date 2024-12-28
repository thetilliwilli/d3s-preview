import { FocusSpan } from "./focus-span.js";

export interface FlameSpan {
  name: string; //'a.objectEach',
  id: string; //'25',
  value: number; //16416,
  color: string; //colors[0],
  x: number; //-15,
  low: number; //65924,
  high: number; //82340
  custom: FocusSpan;
}
