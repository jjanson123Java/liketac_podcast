import { expect, test } from "@playwright/test";

test("catalog groups episodes by subject and exposes free episode details", async ({ page }) => {
  await page.goto("/shows");
  await expect(page.getByRole("heading", { name: "AI without the headache" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deploying and Configuring Expressway" })).toBeVisible();
  await expect(page.getByText("Coming Soon", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start Here", exact: true })).toBeVisible();
  await expect(page.getByText("New Episode", { exact: true })).toBeVisible();

  await page
    .getByRole("article")
    .filter({ hasText: "AI: useful coworker or confident liar?" })
    .getByRole("link", { name: "Play episode" })
    .click();
  await expect(page.getByRole("heading", { name: "AI: useful coworker or confident liar?" })).toBeVisible();
  await expect(page.getByText("Media coming soon")).toBeVisible();
});
