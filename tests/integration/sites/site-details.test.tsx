import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import SiteDetails from "@/app/(dashboard)/dashboard/sites/[id]/page";
import { server } from "../../mocks/server";

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

describe("SiteDetails page (Sites/Locations)", () => {
  it("loads and renders site information", async () => {
    getCookieStore().set("access_token", "test-token");
    (globalThis as any).__TEST_ROUTE_PARAMS__ = { id: "1" };

    const site = {
      id: 1,
      name: "Test Site",
      postcode: "SW1A 1AA",
      address: "10 Downing Street",
      contact_position: "Ops",
      contact_phone: "07700112233",
      contact_name: "Alice",
      contact_email: "alice@example.com",
      radius_m: 2500,
      latitude: 51.5014,
      longitude: -0.1419,
      number_of_allocated_vehicles: 5,
      max_staff_allowed: 10,
      status: "active",
      image: null,
      notes: "Some notes",
      created_by: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      operation_hours: [
        {
          day_of_week: 0,
          opens_at: "09:00",
          closes_at: "17:00",
          is_closed: false,
          is_open_24_hours: false,
        },
        ...Array.from({ length: 6 }, (_, i) => ({
          day_of_week: i + 1,
          opens_at: "09:00",
          closes_at: "17:00",
          is_closed: false,
          is_open_24_hours: false,
        })),
      ],
      warnings: [],
      missing_attributes: [],
      users: [],
      site_vehicles: [],
      presence: { early: "07:00", middle: "09:00", night: "22:00", day: "12:00", supervisor: "08:00" },
      staff: { driver: 1, admin: 2, mechanic: 3, total: 6 },
    };

    server.use(
      http.get(`${API_URL}/api/sites/1/`, () => {
        return HttpResponse.json(site, { status: 200 });
      }),
    );

    render(<SiteDetails />);

    expect(await screen.findByText("Test Site")).toBeInTheDocument();
    expect(screen.getByText("Sites Details")).toBeInTheDocument();
    expect(screen.getByText("10 Downing Street")).toBeInTheDocument();
  });

  it("saves edits: sends PATCH + PUT for operation hours", async () => {
    getCookieStore().set("access_token", "test-token");
    (globalThis as any).__TEST_ROUTE_PARAMS__ = { id: "1" };

    const site = {
      id: 1,
      name: "Test Site",
      postcode: "SW1A 1AA",
      address: "10 Downing Street",
      contact_position: "Ops",
      contact_phone: "07700112233",
      contact_name: "Alice",
      contact_email: "alice@example.com",
      radius_m: 2500,
      latitude: 51.5014,
      longitude: -0.1419,
      number_of_allocated_vehicles: 5,
      max_staff_allowed: 10,
      status: "active",
      image: null,
      notes: "Some notes",
      created_by: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      operation_hours: [
        { day_of_week: 0, opens_at: "09:00", closes_at: "17:00", is_closed: false, is_open_24_hours: false },
        ...Array.from({ length: 6 }, (_, i) => ({
          day_of_week: i + 1,
          opens_at: "09:00",
          closes_at: "17:00",
          is_closed: false,
          is_open_24_hours: false,
        })),
      ],
      warnings: [],
      missing_attributes: [],
      users: [],
      site_vehicles: [],
      presence: { early: "07:00", middle: "09:00", night: "22:00", day: "12:00", supervisor: "08:00" },
      staff: { driver: 1, admin: 2, mechanic: 3, total: 6 },
    };

    let patchCalled = false;
    let putCalled = false;

    server.use(
      http.get(`${API_URL}/api/sites/1/`, () => HttpResponse.json(site, { status: 200 })),
      http.patch(`${API_URL}/api/sites/1/`, async () => {
        patchCalled = true;
        return HttpResponse.json({ ok: true }, { status: 200 });
      }),
      http.put(`${API_URL}/api/sites/1/hours/bulk/`, async () => {
        putCalled = true;
        return HttpResponse.json({ ok: true }, { status: 200 });
      }),
    );

    render(<SiteDetails />);
    await screen.findByText("Test Site");

    // Toggle into edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Click "Save" (fixed action)
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(patchCalled).toBe(true);
      expect(putCalled).toBe(true);
    });
  });
});

