import { http, HttpResponse } from "msw";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://test.fosterhartley.uk";

export const handlers = [
  http.post(`${API_URL}/auth/login/`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    // Keep this deterministic for tests.
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json(
        {
          data: {
            access: "access-token",
            refresh: "refresh-token",
            user: { id: 42 },
            role_slug: "admin",
          },
        },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      { message: "Invalid credentials" },
      { status: 400 },
    );
  }),

  http.post(`${API_URL}/auth/password-reset/`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    if (!body.email) {
      return HttpResponse.json({ message: "Email is required" }, { status: 400 });
    }
    return HttpResponse.json(
      { message: "OTP sent to your email" },
      { status: 200 },
    );
  }),

  http.put(`${API_URL}/api/profiles/driver/123/`, async () => {
    return HttpResponse.json({ success: true, id: 1 }, { status: 200 });
  }),
];

