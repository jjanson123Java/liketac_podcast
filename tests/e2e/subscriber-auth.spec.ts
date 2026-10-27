import { expect, test } from "@playwright/test";

test("subscriber signup, sign in, and recovery pages expose the required controls", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Subscribe to Like TAC" })).toBeVisible();
  await expect(page.getByLabel("First name")).toBeVisible();
  await expect(page.getByLabel("Pronouns (optional)")).toBeVisible();
  await expect(page.getByLabel(/I approve receiving/)).toBeVisible();
  await expect(page.getByText("Add one of these special characters: ! @ * #.")).toBeVisible();

  await page.goto("/sign-in");
  await expect(page.getByRole("link", { name: "Forgot my username" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot my password" })).toBeVisible();

  await page.getByRole("link", { name: "Forgot my password" }).click();
  await expect(page.getByText(/suggested strong password/i)).toBeVisible();
  await expect(page.locator("input[name=suggestedPassword]")).toHaveCount(0);
});
