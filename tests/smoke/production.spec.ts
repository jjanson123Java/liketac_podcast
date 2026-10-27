import { expect, test } from "@playwright/test";

const productionUrl = process.env.PRODUCTION_URL ?? "https://liketac.live";

test("production domain serves the core public journeys", async ({ page, request }) => {
  await page.goto(productionUrl);
  await expect(page).toHaveTitle(/Like TAC/i);
  await expect(page.getByRole("heading", { name: /For the rest of us/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign Up Free" })).toBeVisible();

  for (const path of ["/shows", "/help", "/signup", "/sign-in", "/privacy", "/terms"]) {
    const response = await request.get(`${productionUrl}${path}`);
    expect(response.ok(), `${path} should be available`).toBe(true);
  }

  const wwwResponse = await request.get("https://www.liketac.live", { maxRedirects: 0 });
  expect([301, 302, 307, 308]).toContain(wwwResponse.status());
  expect(wwwResponse.headers().location).toContain("liketac.live");
});
