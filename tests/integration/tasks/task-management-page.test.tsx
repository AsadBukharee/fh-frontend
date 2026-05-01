import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import Page from "@/app/(dashboard)/dashboard/tasks/task-management/page";
import { server } from "../../mocks/server";

// Keep this page test focused on list/query behavior; dialogs have their own tests.
vi.mock("@/components/task/CreateTaskDialog", () => ({ default: () => null }));
vi.mock("@/components/task/ViewTaskDialog", () => ({ default: () => null }));
vi.mock("@/components/task/UpdateTaskDialog", () => ({ default: () => null }));
vi.mock("@/components/task/HistoryTaskDialog", () => ({ default: () => null }));
vi.mock("@/components/task/ReassignTaskDialog", () => ({ default: () => null }));
vi.mock("@/app/utils/ExportButton", () => ({ default: () => null }));

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

describe("Task Management page", () => {
  it("loads tasks and applies search query parameter", async () => {
    getCookieStore().set("access_token", "test-token");

    const tasksCalls: string[] = [];

    server.use(
      http.get(`${API_URL}/api/task-types/`, () => {
        return HttpResponse.json({ results: [{ id: 1, name: "General", description: "", is_active: true }] }, { status: 200 });
      }),
      http.get(`${API_URL}/users/`, () => {
        return HttpResponse.json({ data: { results: [{ id: 10, full_name: "Alice", email: "alice@example.com", role: "admin", avatar: null }] } }, { status: 200 });
      }),
      http.get(`${API_URL}/api/tasks/`, ({ request }) => {
        tasksCalls.push(request.url);
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        const results = [
          {
            id: 101,
            title: search ? `Task: ${search}` : "Initial Task",
            description: "<p>Hello</p>",
            task_type: { id: 1, name: "General", description: "", is_active: true },
            task_type_display: "General",
            assigned_to: { id: 10, full_name: "Alice", email: "alice@example.com", role: "admin", avatar: null },
            assigned_to_display: "Alice",
            assigned_by: { id: 10, full_name: "Alice", email: "alice@example.com", role: "admin", avatar: null },
            assigned_by_display: "Alice",
            deadline: new Date().toISOString(),
            priority: "low",
            status: "not_viewed",
            reason: null,
            estimated_hours: null,
            actual_hours: null,
            completion_notes: null,
            requires_approval: false,
            approved_by: null,
            approved_at: null,
            assignment_logs: [],
            history: [],
            change_logs: [],
            is_overdue: false,
            days_until_deadline: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_system_generated: false,
          },
        ];
        return HttpResponse.json({ count: 1, next: null, previous: null, results }, { status: 200 });
      }),
    );

    const user = userEvent.setup();
    render(<Page />);

    expect(await screen.findByText("Task Management")).toBeInTheDocument();
    expect(await screen.findByText("Initial Task")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/search tasks/i), "engine");

    expect(await screen.findByText("Task: engine")).toBeInTheDocument();

    await waitFor(() => {
      // We should have at least two calls: initial load and the search-triggered refetch.
      expect(tasksCalls.length).toBeGreaterThanOrEqual(2);
      const lastUrl = tasksCalls[tasksCalls.length - 1];
      expect(lastUrl).toContain("search=engine");
    });
  });
});

