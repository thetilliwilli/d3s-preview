import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TypeTag } from "../component/property-grid/input-control/type-tag";

interface InitialState {
  isDebugging: boolean;
  selectedBindings: string[];
  editViewWindowOptions: { name: string; value: any; type: TypeTag; nodeGuid: string, nodeName: string } | undefined;
}

const initialState: InitialState = {
  isDebugging: false,
  selectedBindings: [],
  editViewWindowOptions: undefined,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    enableDebugging(state) {
      state.isDebugging = true;
    },
    disableDebugging(state) {
      state.isDebugging = false;
    },
    selectBinding(state, action: PayloadAction<string[]>) {
      state.selectedBindings = action.payload;
    },
    clearBindingSelection(state) {
      state.selectedBindings = [];
    },
    createEditViewWindow(state, action: PayloadAction<{ name: string; value: any; type: TypeTag; nodeGuid: string, nodeName: string }>) {
      state.editViewWindowOptions = action.payload;
    },
    destroyEditViewWindow(state) {
      state.editViewWindowOptions = undefined;
    },
  },
});
