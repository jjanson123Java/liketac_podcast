import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { CatalogPreview } from "./catalog-preview";

describe("CatalogPreview", () => {
  test("uses a muted chromeless preview and jumps through the approved excerpt sequence", () => {
    const { container } = render(
      <CatalogPreview src="/api/media/video-1" title="AI basics" hasPodcast />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;

    expect(video).toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("controls");
    expect(video).toHaveProperty("muted", true);
    expect(screen.getByRole("button", { name: "Unmute preview" })).toBeVisible();
    expect(screen.getByText("Preview 0:00")).toBeVisible();
    expect(screen.getByText("Preview 0:00")).not.toHaveAttribute("aria-live");

    video.currentTime = 7;
    fireEvent.timeUpdate(video);
    expect(video.currentTime).toBe(17);
    expect(screen.getByText("Preview 0:17")).toBeVisible();

    video.currentTime = 20;
    fireEvent.timeUpdate(video);
    expect(video.currentTime).toBe(27);
    expect(screen.getByText("Preview 0:27")).toBeVisible();

    video.currentTime = 30;
    fireEvent.timeUpdate(video);
    expect(video.currentTime).toBe(0);
    expect(screen.getByText("Preview 0:00")).toBeVisible();
  });

  test("restarts the opener after the media reaches its actual end", () => {
    const { container } = render(
      <CatalogPreview src="/media/podcast-opener/like-tac-podcast-opener.mp4" title="Coming soon" hasPodcast={false} />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    const play = vi.fn().mockResolvedValue(undefined);
    video.play = play;
    video.currentTime = 7;

    fireEvent.ended(video);

    expect(video.currentTime).toBe(0);
    expect(play).toHaveBeenCalledOnce();
  });

  test("stops automatic motion when the visitor requests reduced motion", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { container } = render(
      <CatalogPreview src="/api/media/video-1" title="AI basics" hasPodcast />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    const pause = vi.fn();
    video.pause = pause;
    video.currentTime = 3;

    fireEvent.loadedMetadata(video);

    expect(pause).toHaveBeenCalledOnce();
    expect(video.currentTime).toBe(0);
    window.matchMedia = originalMatchMedia;
  });

  test("exposes mute and unmute as the only catalog control", () => {
    const { container } = render(
      <CatalogPreview src="/media/podcast-opener/like-tac-podcast-opener.mp4" title="Coming soon" hasPodcast={false} />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    const unmute = screen.getByRole("button", { name: "Unmute preview" });

    fireEvent.click(unmute);
    expect(video.muted).toBe(false);
    expect(screen.getByRole("button", { name: "Mute preview" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /play|pause|full screen/i })).not.toBeInTheDocument();
  });
});
