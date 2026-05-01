import { describe, expect, it } from "vitest";

import walkaroundReducer, {
  resetWalkaroundState,
  setWalkaroundDefects,
  setWalkaroundVehicle,
} from "@/app/store/slices/walkaroundSlice";

describe("walkaroundSlice reducer", () => {
  it("returns initial state when state is undefined", () => {
    const state = walkaroundReducer(undefined, { type: "unknown" });
    expect(state.vehicleId).toBeNull();
    expect(state.walkaroundDefects).toEqual([]);
  });

  it("updates vehicleId and defects", () => {
    const withVehicle = walkaroundReducer(undefined, setWalkaroundVehicle(55));
    expect(withVehicle.vehicleId).toBe(55);

    const defects = [
      { defect_text: "Broken light", priority: "High", color: "red" },
      { defect_text: "Loose bolt", priority: "Low", color: "blue" },
    ];
    const withDefects = walkaroundReducer(withVehicle, setWalkaroundDefects(defects));
    expect(withDefects.walkaroundDefects).toEqual(defects);
  });

  it("resets to initial state", () => {
    const withStuff = walkaroundReducer(undefined, setWalkaroundDefects([{ defect_text: "X", priority: "High", color: "red" }]));
    const reset = walkaroundReducer(withStuff, resetWalkaroundState());
    expect(reset).toEqual({ vehicleId: null, walkaroundDefects: [] });
  });
});

