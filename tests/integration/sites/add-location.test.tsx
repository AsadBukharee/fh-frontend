import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import AddLocation from "@/components/sites/AddLocation";
import { server } from "../../mocks/server";

function getCookieStore() {
  return (globalThis as any).__TEST_COOKIE_STORE__ as Map<string, string>;
}

describe("AddLocation (Sites/Locations)", () => {
  it("shows validation errors for invalid postcode", async () => {
    getCookieStore().set("access_token", "test-token");

    render(
      <AddLocation
        siteId={1}
        editLocation={{
          id: 10,
          name: "Warehouse A",
          associated_location: null,
          is_base: true,
          is_loca_group: true,
          is_maintenance: false,
          zipcode: "NOTAPOSTCODE",
          address: "221B Baker Street",
          custom_order: 1,
          lat: null,
          lon: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          site: 1,
        }}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /update location/i }));

    expect(await screen.findByText(/please enter a valid uk postcode/i)).toBeInTheDocument();
  });

  it("submits update request with auth header and calls onSuccess", async () => {
    getCookieStore().set("access_token", "test-token");

    let putCalled = false;
    let receivedAuthHeader: string | null = null;
    let receivedBodyName: string | null = null;

    const editLocation = {
      id: 11,
      name: "Warehouse B",
      associated_location: null,
      is_base: true,
      is_loca_group: true,
      is_maintenance: false,
      zipcode: "SW1A 1AA",
      address: "10 Downing Street",
      custom_order: 2,
      lat: 51.5014,
      lon: -0.1419,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      site: 1,
    };

    server.use(
      http.put(`${process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk"}/activity/locations/${editLocation.id}`, async ({ request }) => {
        putCalled = true;
        receivedAuthHeader = request.headers.get("authorization");
        const body = (await request.json()) as any;
        receivedBodyName = body?.name ?? null;
        return HttpResponse.json({ success: true }, { status: 200 });
      }),
    );

    const onSuccess = vi.fn();
    render(
      <AddLocation siteId={1} editLocation={editLocation as any} onSuccess={onSuccess} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /update location/i }));

    await waitFor(() => expect(putCalled).toBe(true));
    expect(receivedAuthHeader).toBe("Bearer test-token");
    expect(receivedBodyName).toBe("Warehouse B");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});

