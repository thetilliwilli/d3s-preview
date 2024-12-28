import { NetworkState } from "@d3s/state";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface InitialState {
  network: NetworkState;
  selectedNodes: string[];
}

const initialState: InitialState = {
  network: new NetworkState(),
  selectedNodes: [],
};

export const networkSlice = createSlice({
  name: "network",
  initialState,
  reducers: {
    replaceState(state, action: PayloadAction<NetworkState>) {
      state.network = action.payload;
    },
    selectNode(state, action: PayloadAction<string>) {
      state.selectedNodes = [action.payload];
    },
    clearSelection(state) {
      state.selectedNodes = [];
    },
  },
});
