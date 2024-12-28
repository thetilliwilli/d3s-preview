import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { BindingStart } from "../component/property-grid/binding-start";

interface InitialState {
  bindingStart?: BindingStart;
}

const initialState: InitialState = {
  bindingStart: undefined,
};

export const bindingSlice = createSlice({
  name: "binding",
  initialState,
  reducers: {
    startBinding(state, action: PayloadAction<BindingStart>) {
      state.bindingStart = action.payload;
    },
    endBinding(state) {
      state.bindingStart = undefined;
    },
  },
});
