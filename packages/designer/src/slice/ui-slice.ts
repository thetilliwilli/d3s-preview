import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TypeTag } from "../component/property-grid/input-control/type-tag";

interface InitialState {
  selectedBindings: string[];
  editViewWindowOptions: { name: string; value: any; type: TypeTag; nodeGuid: string; nodeName: string } | undefined;
  showOmnibox: boolean;
}

const initialState: InitialState = {
  selectedBindings: [],
  editViewWindowOptions: undefined,
  showOmnibox: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    selectBinding(state, action: PayloadAction<string[]>) {
      state.selectedBindings = action.payload;
    },
    clearBindingSelection(state) {
      state.selectedBindings = [];
    },
    createEditViewWindow(
      state,
      action: PayloadAction<{ name: string; value: any; type: TypeTag; nodeGuid: string; nodeName: string }>
    ) {
      state.editViewWindowOptions = action.payload;
    },
    destroyEditViewWindow(state) {
      state.editViewWindowOptions = undefined;
    },
    showOmnibox(state) {
      state.showOmnibox = true;
    },
    hideOmnibox(state) {
      state.showOmnibox = false;
    },
  },
});
