import { expect, test } from "@playwright/test";

test("administrator routes stay separate and show the branded MFA controls", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Administrator sign in" })).toBeVisible();
  await expect(page.getByText(/separate from member sign in/i)).toBeVisible();

  await page.goto("/admin/verify?challenge=example");
  await expect(page.getByRole("heading", { name: "Enter your six-digit code" })).toBeVisible();
  await expect(page.getByLabel("Verification code")).toHaveAttribute("pattern", "[0-9]{6}");
  await expect(page.getByLabel(/Trust this device for 30 days/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Verify and continue" })).toBeVisible();
});

test("Companion upload handoffs require an authenticated administrator", async ({ request }) => {
  const response = await request.post("/api/admin/podcasts/handoff", { data: { episodeId: "86420552-d588-449f-a5ba-3ecac12bf373" } });
  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Administrator authentication required." });
});
