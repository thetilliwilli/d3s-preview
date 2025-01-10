export { EventEmitter } from "./event-emitter";

export function exhaustiveCheck(value: never): never {
  throw new Error("Необработанный случай: " + (value + ""));
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function debounce<T extends (...args: any[]) => void>(func: T, timeout: number = 400): T {
  let timer = -1;
  return function (...args: any[]) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      func(...args);
    }, timeout);
  } as T;
}

export function throttle<T extends (...args: any[]) => void>(func: T, timeout: number = 400): T {
  let timer: any = -1;
  return function (...args) {
    if (timer === -1)
      timer = setTimeout(() => {
        timer = -1;
        func(...args);
      }, timeout);
  } as T;
}

/** 2023-11-25T15:50:50.282Z -> 20231125155050282 */
export function slugDate(date: Date | number): string {
  return new Date(date).toISOString().replace(/[-:T.Z]/g, "");
}

export function isNotUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export type Dictionary<TValue> = Record<string, TValue>;
