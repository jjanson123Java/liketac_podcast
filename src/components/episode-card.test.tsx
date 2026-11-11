import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { EpisodeCard } from "./episode-card";

describe("EpisodeCard", () => {
  test("shows the approved opener on Browse Shows when the episode recording is not uploaded", () => {
    const { container } = render(
      <EpisodeCard
        episode={{
          slug: "ai-useful-coworker",
          title: "AI: useful coworker or confident liar?",
          summary: "A plain-language AI conversation.",
          publishedAt: new Date("2026-10-27T12:00:00Z"),
          isStartHere: false,
          isCurrent: true,
          access: "full",
          hasMedia: false,
          previewMediaId: null,
        }}
      />,
    );

    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "/media/podcast-opener/like-tac-podcast-opener.mp4",
    );
    expect(screen.getByLabelText("AI: useful coworker or confident liar? opening reel placeholder")).toBeVisible();
    expect(container.querySelector("video")).not.toHaveAttribute("controls");
    expect(screen.getByRole("button", { name: "Unmute preview" })).toBeVisible();
  });

  test("uses the approved catalog media route when a podcast preview exists", () => {
    const { container } = render(
      <EpisodeCard
        episode={{
          slug: "ai-useful-coworker",
          title: "AI: useful coworker or confident liar?",
          summary: "A plain-language AI conversation.",
          publishedAt: new Date("2026-10-27T12:00:00Z"),
          isStartHere: false,
          isCurrent: true,
          access: "full",
          hasMedia: true,
          previewMediaId: "video-1",
        }}
      />,
    );

    expect(container.querySelector("video")).toHaveAttribute("src", "/api/media/video-1");
  });

  test("locks protected visitor content when no generated teaser exists", () => {
    const { container } = render(<EpisodeCard episode={{ slug: "protected", title: "Protected episode", summary: "Members only", publishedAt: new Date(), isStartHere: false, isCurrent: false, access: "teaser", hasMedia: true, previewMediaId: null }} />);
    expect(container.querySelector("video, audio")).toBeNull();
    expect(screen.getByText(/Preview being prepared/i)).toBeVisible();
    expect(screen.getByRole("link", { name: "Subscribe Free to Watch" })).toHaveAttribute("href", "/signup");
  });

  test("sends a protected visitor with a teaser to the episode sign-in gate", () => {
    render(<EpisodeCard episode={{ slug: "protected", title: "Protected episode", summary: "Members only", publishedAt: new Date(), isStartHere: false, isCurrent: false, access: "teaser", hasMedia: true, previewMediaId: "teaser-1" }} />);
    expect(screen.getByRole("link", { name: "Watch 45-second preview" })).toHaveAttribute("href", "/shows/protected");
  });
});
