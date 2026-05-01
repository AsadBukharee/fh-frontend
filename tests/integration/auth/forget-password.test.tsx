import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ForgetPassword from "@/app/(pages)/forget-password/page";

describe("ForgetPassword page", () => {
  it("shows an error toast and does not call the API for invalid email", async () => {
    const user = userEvent.setup();
    render(<ForgetPassword />);

    const emailInput = screen.getByLabelText(/enter email/i);
    await user.type(emailInput, "not-an-email");

    // Submit the form directly to avoid depending on the custom button's default HTML type.
    fireEvent.submit(screen.getByLabelText(/password reset form/i));

    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
  });

  it("submits to the API and clears the input on success", async () => {
    const user = userEvent.setup();
    render(<ForgetPassword />);

    const emailInput = screen.getByLabelText(/enter email/i);
    await user.type(emailInput, "test@example.com");

    await user.click(screen.getByRole("button", { name: /send email/i }));

    expect(await screen.findByText("OTP sent to your email")).toBeInTheDocument();
    expect(emailInput).toHaveValue("");
  });
});

