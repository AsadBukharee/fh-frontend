import { describe, expect, it } from "vitest";

import driverReducer, {
  resetDriverState,
  setDriverId,
  setNextOfKinData,
  setPersonalInfoData,
} from "@/app/store/slices/driverSlice";

describe("driverSlice reducer", () => {
  it("returns initial state when state is undefined", () => {
    const state = driverReducer(undefined, { type: "unknown" });
    expect(state.driverId).toBeNull();
    expect(state.personalInfoData).toBeNull();
    expect(state.nextOfKinData).toBeNull();
  });

  it("updates driverId and resets correctly", () => {
    const withId = driverReducer(undefined, setDriverId(123));
    expect(withId.driverId).toBe(123);

    const withPersonal = driverReducer(withId, setPersonalInfoData({ name: "Alice" }));
    expect(withPersonal.personalInfoData).toEqual({ name: "Alice" });

    const reset = driverReducer(withPersonal, resetDriverState());
    expect(reset.driverId).toBeNull();
    expect(reset.personalInfoData).toBeNull();
    expect(reset.nextOfKinData).toBeNull();
  });

  it("sets nextOfKinData", () => {
    const state = driverReducer(undefined, setNextOfKinData({ kin_name: "Bob" }));
    expect(state.nextOfKinData).toEqual({ kin_name: "Bob" });
  });
});

