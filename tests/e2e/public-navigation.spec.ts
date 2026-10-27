import { expect, test } from "@playwright/test";

test("public navigation, theme, and mobile menu remain usable", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "For the rest of us.",
  );
  await expect(page.getByRole("link", { name: "Who It’s For" })).toBeVisible();

  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: "Menu" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Browse Shows" })).toBeVisible();
});
