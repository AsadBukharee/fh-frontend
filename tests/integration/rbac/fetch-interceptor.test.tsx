import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import FetchInterceptor from "@/components/FetchInterceptor";
import { server } from "../../mocks/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

describe("RBAC / permission handling via FetchInterceptor", () => {
  it("opens Access Restricted dialog on 403 response", async () => {
    server.use(
      http.get(`${API_URL}/forbidden-for-test`, () => {
        return HttpResponse.json({ detail: "RBAC: forbidden for this role" }, { status: 403 });
      }),
    );

    render(<FetchInterceptor />);

    // Trigger a fetch that returns 403.
    await waitFor(async () => {
      const res = await window.fetch(`${API_URL}/forbidden-for-test`);
      expect(res.status).toBe(403);
    });

    expect(await screen.findByText("Access Restricted")).toBeInTheDocument();
    expect(screen.getByText("RBAC: forbidden for this role")).toBeInTheDocument();

    // Ensure we can close the dialog.
    fireEvent.click(screen.getByRole("button", { name: /understand/i }));
    await waitFor(() => {
      expect(screen.queryByText("Access Restricted")).not.toBeInTheDocument();
    });
  });
});

