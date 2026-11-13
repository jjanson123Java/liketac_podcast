import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

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
    const onLockedPlay = vi.fn();
    const { container } = render(<EpisodeCard episode={{ slug: "protected", title: "Protected episode", summary: "Members only", publishedAt: new Date(), isStartHere: false, isCurrent: false, access: "teaser", hasMedia: true, previewMediaId: null }} onLockedPlay={onLockedPlay} />);
    expect(container.querySelector("video, audio")).toBeNull();
    expect(screen.getByText(/Preview being prepared/i)).toBeVisible();
    const action = screen.getByRole("button", { name: /Play Protected episode/i });
    expect(action).toHaveClass("lockedEpisodeAction");
    fireEvent.click(action);
    expect(onLockedPlay).toHaveBeenCalledWith("Protected episode");
  });

  test("keeps the teaser visible but locks full playback for a visitor", () => {
    const onLockedPlay = vi.fn();
    render(<EpisodeCard episode={{ slug: "protected", title: "Protected episode", summary: "Members only", publishedAt: new Date(), isStartHere: false, isCurrent: false, access: "teaser", hasMedia: true, previewMediaId: "teaser-1" }} onLockedPlay={onLockedPlay} />);
    expect(screen.getByLabelText("Protected episode catalog preview")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Play Protected episode/i }));
    expect(onLockedPlay).toHaveBeenCalledWith("Protected episode");
  });

  test("keeps normal episode navigation for an authorized subscriber", () => {
    render(<EpisodeCard episode={{ slug: "protected", title: "Protected episode", summary: "Members only", publishedAt: new Date(), isStartHere: false, isCurrent: false, access: "full", hasMedia: true, previewMediaId: "teaser-1" }} isSubscriber />);
    expect(screen.getByRole("link", { name: "Play episode" })).toHaveAttribute("href", "/shows/protected");
  });
});
