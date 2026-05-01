import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Login from "@/app/(pages)/login/page";

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

function getRouterPushSpy() {
  return (globalThis as any).__TEST_ROUTER_PUSH__ as any;
}

describe("Login page", () => {
  it("logs in successfully: sets cookies and redirects to /dashboard", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText(/enter your email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(getRouterPushSpy()).toHaveBeenCalledWith("/dashboard");
    });

    const cookies = getCookieStore();
    expect(cookies.get("access_token")).toBe("access-token");
    expect(cookies.get("refresh_token")).toBe("refresh-token");
    expect(String(cookies.get("user_id"))).toBe("42");
    expect(cookies.get("role")).toBe("admin");
  });

  it("shows a user-friendly error toast/message on invalid credentials", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByPlaceholderText(/enter your email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "wrong-password");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Login failed. Please check your credentials."),
    ).toBeInTheDocument();
  });
});

