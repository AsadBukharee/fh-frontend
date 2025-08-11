// src/store/slices/driverSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DriverState {
  driverId: number | null;
  personalInfoData: any;
  nextOfKinData: any;
  healthQuestionsData: any;
  documentsData: any;
}

const initialState: DriverState = {
  driverId: null,
  personalInfoData: null,
  nextOfKinData: null,
  healthQuestionsData: null,
  documentsData: null,
};

const driverSlice = createSlice({
  name: "driver",
  initialState,
  reducers: {
    setDriverId(state, action: PayloadAction<number | null>) {
      state.driverId = action.payload;
    },
    setPersonalInfoData(state, action: PayloadAction<any>) {
      state.personalInfoData = action.payload;
    },
    setNextOfKinData(state, action: PayloadAction<any>) {
      state.nextOfKinData = action.payload;
    },
    setHealthQuestionsData(state, action: PayloadAction<any>) {
      state.healthQuestionsData = action.payload;
    },
    setDocumentsData(state, action: PayloadAction<any>) {
      state.documentsData = action.payload;
    },
    resetDriverState(state) {
      return initialState;
    },
  },
});

export const {
  setDriverId,
  setPersonalInfoData,
  setNextOfKinData,
  setHealthQuestionsData,
  setDocumentsData,
  resetDriverState,
} = driverSlice.actions;
export default driverSlice.reducer;