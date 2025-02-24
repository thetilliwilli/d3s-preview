import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { EditViewWindowOptions } from "../domain/edit-view-window-options";

interface InitialState {
  selectedBindings: string[];
  editViewWindowOptions: EditViewWindowOptions | undefined;
  showOmnibox: boolean;
  showRepositoryWindow: boolean;
}

const initialState: InitialState = {
  selectedBindings: [],
  editViewWindowOptions: undefined,
  showOmnibox: false,
  showRepositoryWindow: false,
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
    createEditViewWindow(state, action: PayloadAction<EditViewWindowOptions>) {
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
    showRepositoryWindow(state) {
      state.showRepositoryWindow = true;
    },
    hideRepositoryWindow(state) {
      state.showRepositoryWindow = false;
    },
  },
});
