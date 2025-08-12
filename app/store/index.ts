// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import driverReducer from "./slices/driverSlice";

const store = configureStore({
  reducer: {
    driver: driverReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;