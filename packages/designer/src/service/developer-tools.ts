import { store } from "../app/store";
import { uiSlice } from "../slice/ui-slice";

export class DeveloperTools {
  constructor(public paper: any, public graph: any) {}

  enableDebugging() {
    store.dispatch(uiSlice.actions.enableDebugging());
  }
  disableDebugging() {
    store.dispatch(uiSlice.actions.disableDebugging());
  }
}
