import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

// Radix Select is difficult to drive in jsdom (portals + pointer events).
// For this test we mock it with a native <select>, while keeping the real dialog logic + MSW calls.
vi.mock("@/components/ui/select", async () => {
  const ReactMod = await import("react");

  const ITEM = Symbol.for("SelectItem");

  function collectItems(node: any, acc: any[]) {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach((n) => collectItems(n, acc));
    if (node?.type?.__SELECT_ITEM__ === ITEM) {
      acc.push(node.props);
      return;
    }
    if (node?.props?.children) collectItems(node.props.children, acc);
  }

  const Select = ({ value, onValueChange, disabled, children }: any) => {
    const items: any[] = [];
    collectItems(children, items);
    return ReactMod.createElement(
      "select",
      {
        value: value ?? "",
        disabled,
        onChange: (e: any) => onValueChange?.(e.target.value),
      },
      [
        ReactMod.createElement("option", { key: "__placeholder__", value: "" }, "—"),
        ...items.map((it) =>
          ReactMod.createElement(
            "option",
            { key: it.value, value: it.value, disabled: Boolean(it.disabled) },
            it.children,
          ),
        ),
      ],
    );
  };

  const SelectTrigger = ({ children }: any) => ReactMod.createElement(ReactMod.Fragment, null, children);
  const SelectValue = ({ placeholder }: any) => ReactMod.createElement("span", null, placeholder ?? "");
  const SelectContent = ({ children }: any) => ReactMod.createElement(ReactMod.Fragment, null, children);
  const SelectItem = (props: any) => ReactMod.createElement("option", props, props.children);
  (SelectItem as any).__SELECT_ITEM__ = ITEM;

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

import ReassignTaskDialog from "@/components/task/ReassignTaskDialog";
import { server } from "../../mocks/server";

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

describe("ReassignTaskDialog", () => {
  it("loads roles -> loads users -> submits reassignment", async () => {
    getCookieStore().set("access_token", "test-token");

    let reassignBody: any = null;

    server.use(
      http.get(`${API_URL}/roles/`, () => {
        return HttpResponse.json(
          { success: true, data: [{ id: 1, slug: "manager", name: "Manager" }] },
          { status: 200 },
        );
      }),
      http.get(`${API_URL}/users/list-names/`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("role") !== "manager") {
          return HttpResponse.json({ success: true, data: [] }, { status: 200 });
        }
        return HttpResponse.json(
          {
            success: true,
            data: [{ id: 99, full_name: "Bob Manager", email: "bob@example.com", avatar: null, sites: [] }],
          },
          { status: 200 },
        );
      }),
      http.post(`${API_URL}/api/tasks/123/reassign/`, async ({ request }) => {
        reassignBody = await request.json();
        return HttpResponse.json({ id: 123 }, { status: 200 });
      }),
    );

    const onClose = vi.fn();
    const onTaskReassigned = vi.fn();

    const user = userEvent.setup();
    render(
      <ReassignTaskDialog
        isOpen={true}
        onClose={onClose}
        taskId={123}
        onTaskReassigned={onTaskReassigned}
      />,
    );

    // Wait for roles to finish loading (form fields render after this).
    await waitFor(() => {
      expect(screen.queryByText(/loading roles/i)).not.toBeInTheDocument();
    });

    const selects = () => screen.getAllByRole("combobox");
    expect(selects().length).toBeGreaterThanOrEqual(2);

    await user.selectOptions(selects()[0], "manager");

    // Open user select and pick Bob
    await user.selectOptions(selects()[1], "99");

    await user.type(screen.getByPlaceholderText(/enter reason/i), "Workload balancing");

    await user.click(screen.getByRole("button", { name: /^reassign$/i }));

    await waitFor(() => {
      expect(onTaskReassigned).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(reassignBody).toEqual({ assigned_to: 99, reason: "Workload balancing" });
  });
});

