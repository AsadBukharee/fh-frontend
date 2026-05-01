import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import SURunList from "@/app/(dashboard)/dashboard/su-transport/su-logs/page";
import { server } from "../../mocks/server";

vi.mock("@/app/utils/ExportButton", () => ({ default: () => null }));

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

const todayYmd = () => new Date().toISOString().slice(0, 10);

describe("SU Transport - SU Logs page", () => {
  it("loads filters and renders a stop row", async () => {
    getCookieStore().set("access_token", "test-token");

    server.use(
      http.get(`${API_URL}/activity/locations/names/`, () => {
        return HttpResponse.json({ success: true, message: "ok", data: [{ id: 1, name: "A" }, { id: 2, name: "B" }] }, { status: 200 });
      }),
      http.get(`${API_URL}/api/profiles/list-names/`, () => {
        return HttpResponse.json({ success: true, message: "ok", data: [{ id: 10, full_name: "Driver One" }] }, { status: 200 });
      }),
      http.get(`${API_URL}/activity/su-run/su-run-list/`, () => {
        return HttpResponse.json(
          {
            success: true,
            message: "ok",
            data: {
              results: [
                {
                  stop_id: 1,
                  date: todayYmd(),
                  time: "10:30",
                  driver_name: "Driver One",
                  from: "A",
                  to: "B",
                  numbers: 2,
                  su_run: 99,
                  run_type: "Type 1",
                },
              ],
              count: 1,
              page: 1,
              page_size: 10,
              total_pages: 1,
            },
          },
          { status: 200 },
        );
      }),
    );

    render(<SURunList />);

    expect(await screen.findByText("SU Data Management")).toBeInTheDocument();
    expect(await screen.findByText("Driver One")).toBeInTheDocument();
    // Assert stable row content (avoid ambiguous single-letter matches).
    expect(await screen.findByText("#99")).toBeInTheDocument();
    expect(screen.getByText("10:30")).toBeInTheDocument();
  });

  it("allows editing SU # and posts update_stop", async () => {
    getCookieStore().set("access_token", "test-token");

    let updateCalled = false;

    server.use(
      http.get(`${API_URL}/activity/locations/names/`, () => HttpResponse.json({ success: true, message: "ok", data: [] }, { status: 200 })),
      http.get(`${API_URL}/api/profiles/list-names/`, () => HttpResponse.json({ success: true, message: "ok", data: [] }, { status: 200 })),
      http.get(`${API_URL}/activity/su-run/su-run-list/`, () => {
        return HttpResponse.json(
          {
            success: true,
            message: "ok",
            data: {
              results: [
                {
                  stop_id: 1,
                  date: todayYmd(),
                  time: "10:30",
                  driver_name: "Driver One",
                  from: "A",
                  to: "B",
                  numbers: 2,
                  su_run: 99,
                  run_type: "Type 1",
                },
              ],
              count: 1,
              page: 1,
              page_size: 10,
              total_pages: 1,
            },
          },
          { status: 200 },
        );
      }),
      http.post(`${API_URL}/activity/su-run/99/su_run_update/`, async ({ request }) => {
        const body = (await request.json()) as any;
        if (body.action === "update_stop") {
          updateCalled = true;
          expect(body).toEqual({ action: "update_stop", stop_id: 1, number: 5 });
        }
        return HttpResponse.json({ success: true }, { status: 200 });
      }),
    );

    const user = userEvent.setup();
    render(<SURunList />);

    // Wait for the initial badge to appear and click it to start edit.
    const badge = await screen.findByText("+2");
    await user.click(badge);

    const input = await screen.findByRole("spinbutton");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(updateCalled).toBe(true));
    expect(await screen.findByText("+5")).toBeInTheDocument();
  });
});

