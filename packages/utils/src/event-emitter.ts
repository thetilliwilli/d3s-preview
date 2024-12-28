import { EventListener } from "./event-listener";

export class EventEmitter {
  private listeners: { [eventName: string]: EventListener[] | undefined } = {};
  public on(eventName: string, listener: EventListener): this {
    if (typeof listener !== "function") throw new Error(`not a function: ${listener}`);
    if (this.listeners[eventName] === undefined) this.listeners[eventName] = [];
    this.listeners[eventName].push(listener);

    return this;
  }

  public once(eventName: string, listener: EventListener): this {
    if (typeof listener !== "function") throw new Error(`not a function: ${listener}`);

    if (this.listeners[eventName] === undefined) this.listeners[eventName] = [];

    const onceListener = (...args: any[]) => {
      if (this.listeners[eventName])
        this.listeners[eventName] = this.listeners[eventName].filter((x) => x !== onceListener);
      listener(...args);
    };

    this.listeners[eventName].push(onceListener);

    return this;
  }

  public off(eventName: string, listener: EventListener): this {
    if (this.listeners[eventName]) this.listeners[eventName] = this.listeners[eventName].filter((x) => x !== listener);

    return this;
  }

  public emit(eventName: string, ...args: any[]): this {
    const eventListeners = this.listeners[eventName] || [];
    for (const listener of eventListeners) listener(...args);

    return this;
  }
}
