import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import TransportDashboard from "@/app/(dashboard)/dashboard/su-transport/numbers/page";
import { server } from "../../mocks/server";

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

describe("SU Transport - Numbers overview", () => {
  it("renders overview data from API", async () => {
    getCookieStore().set("access_token", "test-token");

    server.use(
      http.get(`${API_URL}/activity/su-run/overview/`, () => {
        return HttpResponse.json(
          {
            success: true,
            data: {
              current_run_type: "Early",
              runs: [
                {
                  runName: "Early",
                  startTime: "5:00 AM",
                  endTime: "9:20 AM",
                  data: [{ location: "A", out: 1, in: 2 }],
                  internalJobsList: [
                    { name: "Internal Transfer", Total: "3" },
                    { name: "Internal Jobs", Total: "4" },
                  ],
                },
              ],
            },
          },
          { status: 200 },
        );
      }),
    );

    render(<TransportDashboard />);

    expect(await screen.findByText("SU Number Screen")).toBeInTheDocument();
    expect(await screen.findByText("A")).toBeInTheDocument();
  });
});

