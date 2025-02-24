import EventEmitter from "events";

class KeyboardService extends EventEmitter {
  constructor() {
    super();

    window.document.addEventListener("keydown", (event) => {
      this.emit("*", event);
      this.emit(event.code, event);
    });
  }
}

export const keyboardService = new KeyboardService();
