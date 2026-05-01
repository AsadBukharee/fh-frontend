import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Stepper } from "@/components/add-driver/DriverStepper";
import { NextOfKinStep } from "@/components/add-driver/next-of-kin-step";

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

describe("NextOfKinStep", () => {
  it("submits valid details: calls setNextOfKinData, advances step, and clears localStorage", async () => {
    const cookieStore = getCookieStore();
    cookieStore.set("access_token", "test-token");

    const setNextOfKinData = vi.fn();
    const onStepChange = vi.fn();

    const user = userEvent.setup();

    render(
      <Stepper totalSteps={3} initialStep={0} onStepChange={onStepChange}>
        <NextOfKinStep
          driverId={123}
          user_id={10}
          setNextOfKinData={setNextOfKinData}
        />
      </Stepper>,
    );

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Phone Number"), "07700112233");
    await user.type(screen.getByLabelText("Relation"), "Brother");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Address"), "221B Baker Street");

    await user.click(screen.getByRole("button", { name: /save & next/i }));

    await waitFor(() => {
      expect(setNextOfKinData).toHaveBeenCalledWith(
        expect.objectContaining({
          kin_name: "John Doe",
          kin_contact: "07700112233",
          kin_relationship: "Brother",
          kin_email: "john@example.com",
          kin_address: "221B Baker Street",
        }),
      );
      expect(onStepChange).toHaveBeenCalledWith(1);
    });

    // On success we remove the saved draft.
    expect(window.localStorage.getItem("nextOfKin_123")).toBeNull();
  });

  it("shows validation error for invalid phone and does not advance", async () => {
    const cookieStore = getCookieStore();
    cookieStore.set("access_token", "test-token");

    const setNextOfKinData = vi.fn();
    const onStepChange = vi.fn();

    const user = userEvent.setup();

    render(
      <Stepper totalSteps={3} initialStep={0} onStepChange={onStepChange}>
        <NextOfKinStep
          driverId={123}
          user_id={10}
          setNextOfKinData={setNextOfKinData}
        />
      </Stepper>,
    );

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Phone Number"), "12345");
    await user.type(screen.getByLabelText("Relation"), "Brother");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Address"), "221B Baker Street");

    await user.click(screen.getByRole("button", { name: /save & next/i }));

    expect(
      await screen.findByText(/invalid phone number/i),
    ).toBeInTheDocument();
    expect(setNextOfKinData).not.toHaveBeenCalled();
    expect(onStepChange).not.toHaveBeenCalled();
  });
});

