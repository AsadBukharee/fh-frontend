import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import TaskDetailPage from "@/app/(dashboard)/dashboard/tasks/task-management/[id]/page";
import { server } from "../../mocks/server";

// TipTap-based editor is heavy; mock it for deterministic page tests.
vi.mock("@/components/ui/rich-text-editor", () => ({
  RichTextEditor: ({ value }: any) => React.createElement("div", { "data-testid": "rte" }, value),
}));

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

describe("Task Detail page", () => {
  it("fetches task and auto-marks not_viewed -> viewed via PATCH", async () => {
    getCookieStore().set("access_token", "test-token");
    (globalThis as any).__TEST_ROUTE_PARAMS__ = { id: "555" };

    let patchCalled = false;

    const baseTask = {
      id: 555,
      title: "Inspect Vehicle",
      description: "<p>Check the vehicle</p>",
      task_type: { id: 1, name: "General", description: "", is_active: true },
      task_type_display: "General",
      assigned_to: { id: 10, full_name: "Alice", email: "alice@example.com", role: "admin", avatar: null },
      assigned_by: { id: 11, full_name: "Bob", email: "bob@example.com", role: "manager", avatar: null },
      deadline: new Date().toISOString(),
      priority: "medium",
      status: "not_viewed",
      reason: null,
      estimated_hours: null,
      actual_hours: null,
      completion_notes: null,
      requires_approval: false,
      approved_by: null,
      approved_at: null,
      site: null,
      task_category: "general",
      vehicle: "",
      is_overdue: false,
      days_until_deadline: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      history: [],
    };

    server.use(
      http.get(`${API_URL}/api/tasks/555/`, () => HttpResponse.json(baseTask, { status: 200 })),
      http.patch(`${API_URL}/api/tasks/555/`, async ({ request }) => {
        patchCalled = true;
        const body = (await request.json()) as any;
        expect(body).toEqual({ status: "viewed" });
        return HttpResponse.json({ ...baseTask, status: "viewed" }, { status: 200 });
      }),
      http.get(`${API_URL}/api/vehicles/`, () => HttpResponse.json({ success: true, data: [] }, { status: 200 })),
    );

    render(<TaskDetailPage />);

    expect(await screen.findByText("Inspect Vehicle")).toBeInTheDocument();

    await waitFor(() => {
      expect(patchCalled).toBe(true);
    });
  });
});

