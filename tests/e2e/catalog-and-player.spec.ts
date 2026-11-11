import { expect, test } from "@playwright/test";

test("visitor landing directs to Start Here and protects subscriber episodes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Start Here — Watch Free" })).toHaveAttribute("href", "/shows/tech-at-lunch");
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();

  await page.goto("/shows");
  await expect(page.getByRole("heading", { name: "AI without the headache" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deploying and Configuring Expressway" })).toBeVisible();
  await expect(page.getByText("Coming Soon", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Start Here", { exact: true })).toBeVisible();
  await expect(page.getByText("New Episode", { exact: true })).toBeVisible();
  const protectedEpisode = page.getByRole("article").filter({ hasText: "AI: useful coworker or confident liar?" });
  await expect(protectedEpisode.getByText("Preview being prepared")).toBeVisible();
  await expect(protectedEpisode.getByRole("link", { name: "Subscribe Free to Watch" })).toHaveAttribute("href", "/signup");
  await expect(page.getByLabel("Deploying and Configuring Expressway opening reel placeholder")).toHaveAttribute(
    "src",
    "/media/podcast-opener/like-tac-podcast-opener.mp4",
  );
  await expect(page.getByRole("button", { name: "Unmute preview" }).first()).toBeVisible();
  const catalogPreview = page.getByLabel("Tech explained like you’re at lunch opening reel placeholder");
  await expect(catalogPreview).not.toHaveAttribute("controls");
  await expect.poll(async () => catalogPreview.evaluate((media: HTMLVideoElement) => media.currentTime > 0.25), { timeout: 5_000 }).toBe(true);
  await expect(catalogPreview).toBeHidden({ timeout: 10_000 });
  await expect(page.getByAltText("Tech explained like you’re at lunch preview returned to the opening frame")).toHaveAttribute("src", /liketac-banner-hd\.png/);

  const episodeLink = page
    .getByRole("article")
    .filter({ hasText: "Tech explained like you’re at lunch" })
    .getByRole("link", { name: "Play episode" });
  await Promise.all([
    page.waitForURL("**/shows/tech-at-lunch"),
    episodeLink.click(),
  ]);
  await expect(page.getByRole("heading", { name: "Tech explained like you’re at lunch" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Podcast coming soon" })).toBeVisible();
  await expect(page.getByLabel("Tech explained like you’re at lunch podcast preview")).toHaveAttribute(
    "src",
    "/media/podcast-opener/like-tac-podcast-opener.mp4",
  );
  await expect(page.getByLabel("Tech explained like you’re at lunch podcast preview")).toHaveAttribute("controls");
});
