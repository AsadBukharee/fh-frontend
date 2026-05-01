import { test, expect } from "@playwright/test";

test("login sets auth cookies", async ({ page, context }) => {
  // Stub the login API so the test is deterministic.
  await page.route("**/auth/login/**", async (route) => {
    const request = route.request();
    const body = request.method() === "POST" ? await request.postDataJSON().catch(() => ({})) : {};

    const email = body?.email;
    const password = body?.password;

    if (email === "test@example.com" && password === "password123") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            access: "access-token",
            refresh: "refresh-token",
            user: { id: 42 },
            role_slug: "admin",
          },
        }),
      });
    }

    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ message: "Invalid credentials" }),
    });
  });

  await page.goto("/login");

  await page.getByPlaceholder(/enter your email/i).fill("test@example.com");
  await page.getByPlaceholder(/enter your password/i).fill("password123");

  await page.getByRole("button", { name: /sign in/i }).click();

  // Next-client-cookies writes into document cookies; assert via Playwright context.
  await page.waitForTimeout(500);
  const cookies = await context.cookies();

  const access = cookies.find((c) => c.name === "access_token")?.value;
  const refresh = cookies.find((c) => c.name === "refresh_token")?.value;

  expect(access).toBe("access-token");
  expect(refresh).toBe("refresh-token");
});

