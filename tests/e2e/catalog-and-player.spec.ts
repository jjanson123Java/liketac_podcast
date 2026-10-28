import { expect, test } from "@playwright/test";

test("catalog groups episodes by subject and exposes free episode details", async ({ page }) => {
  await page.goto("/shows");
  await expect(page.getByRole("heading", { name: "AI without the headache" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deploying and Configuring Expressway" })).toBeVisible();
  await expect(page.getByText("Coming Soon", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start Here", exact: true })).toBeVisible();
  await expect(page.getByText("New Episode", { exact: true })).toBeVisible();
  await expect(page.getByLabel("AI: useful coworker or confident liar? opening reel placeholder")).toHaveAttribute(
    "src",
    "/media/podcast-opener/like-tac-podcast-opener.mp4",
  );
  await expect(page.getByLabel("Deploying and Configuring Expressway opening reel placeholder")).toHaveAttribute(
    "src",
    "/media/podcast-opener/like-tac-podcast-opener.mp4",
  );
  await expect(page.getByLabel("Collaboration opening reel placeholder")).toHaveAttribute(
    "src",
    "/media/podcast-opener/like-tac-podcast-opener.mp4",
  );
  await expect(page.getByRole("button", { name: "Unmute preview" }).first()).toBeVisible();
  await expect(page.getByLabel("AI: useful coworker or confident liar? opening reel placeholder")).not.toHaveAttribute("controls");

  const episodeLink = page
    .getByRole("article")
    .filter({ hasText: "AI: useful coworker or confident liar?" })
    .getByRole("link", { name: "Play episode" });
  await Promise.all([
    page.waitForURL("**/shows/ai-useful-coworker"),
    episodeLink.click(),
  ]);
  await expect(page.getByRole("heading", { name: "AI: useful coworker or confident liar?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Podcast coming soon" })).toBeVisible();
  await expect(page.getByLabel("AI: useful coworker or confident liar? podcast preview")).toHaveAttribute(
    "src",
    "/media/podcast-opener/like-tac-podcast-opener.mp4",
  );
  await expect(page.getByLabel("AI: useful coworker or confident liar? podcast preview")).toHaveAttribute("controls");
});
