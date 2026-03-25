// app/store/slices/walkaroundSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WalkaroundDefect {
  /** The walkaround question text used as the default defect description */
  defect_text: string;
  priority: string;
  color: string;
}

interface WalkaroundState {
  /** Vehicle ID captured from the WalkaroundQuestions flow */
  vehicleId: number | null;
  /** Defects selected during the walkaround that should pre-populate AddMechanicDefectDialog */
  walkaroundDefects: WalkaroundDefect[];
}

const initialState: WalkaroundState = {
  vehicleId: null,
  walkaroundDefects: [],
};

const walkaroundSlice = createSlice({
  name: "walkaround",
  initialState,
  reducers: {
    setWalkaroundVehicle(state, action: PayloadAction<number | null>) {
      state.vehicleId = action.payload;
    },
    setWalkaroundDefects(state, action: PayloadAction<WalkaroundDefect[]>) {
      state.walkaroundDefects = action.payload;
    },
    resetWalkaroundState() {
      return initialState;
    },
  },
});

export const { setWalkaroundVehicle, setWalkaroundDefects, resetWalkaroundState } =
  walkaroundSlice.actions;
export default walkaroundSlice.reducer;
