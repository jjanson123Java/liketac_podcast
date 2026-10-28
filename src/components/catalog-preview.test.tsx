import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { CatalogPreview } from "./catalog-preview";

describe("CatalogPreview", () => {
  test("uses a muted chromeless preview and jumps through the approved excerpt sequence", () => {
    const { container } = render(
      <CatalogPreview src="/api/media/video-1" title="AI basics" hasPodcast kind="video" />,
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

    const pause = vi.fn();
    video.pause = pause;
    video.currentTime = 30;
    fireEvent.timeUpdate(video);
    expect(video.currentTime).toBe(0);
    expect(pause).toHaveBeenCalledOnce();
    expect(screen.getByAltText("AI basics preview returned to the opening frame")).toHaveAttribute("src", expect.stringContaining("liketac-banner-hd.png"));
    expect(screen.getByText("Preview complete · 0:00")).toBeVisible();
  });

  test("checks playback frequently instead of waiting for a coarse browser timeupdate event", () => {
    vi.useFakeTimers();
    const { container } = render(
      <CatalogPreview src="/api/media/video-1" title="AI basics" hasPodcast kind="video" />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    video.currentTime = 7.05;

    fireEvent.play(video);
    vi.advanceTimersByTime(100);

    expect(video.currentTime).toBe(17);
    vi.useRealTimers();
  });

  test("explicitly starts muted playback when the media is ready", () => {
    const { container } = render(
      <CatalogPreview src="/api/media/video-1" title="AI basics" hasPodcast kind="video" />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    const play = vi.fn().mockResolvedValue(undefined);
    video.play = play;

    fireEvent.canPlay(video);

    expect(play).toHaveBeenCalledOnce();
  });

  test("returns the opener to its beginning and stops after one cycle", () => {
    const { container } = render(
      <CatalogPreview src="/media/podcast-opener/like-tac-podcast-opener.mp4" title="Coming soon" hasPodcast={false} kind="video" />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    const pause = vi.fn();
    video.pause = pause;
    video.currentTime = 7;

    fireEvent.ended(video);

    expect(video.currentTime).toBe(0);
    expect(pause).toHaveBeenCalledOnce();
    expect(screen.getByAltText("Coming soon preview returned to the opening frame")).toBeVisible();
    expect(screen.queryByRole("button", { name: /mute preview/i })).not.toBeInTheDocument();
    expect(screen.getByText("Preview ended")).toBeVisible();
    expect(screen.getByText("Preview complete · 0:00")).toBeVisible();
  });

  test("uses a branded visual while an audio-only preview follows the same sequence", () => {
    const { container } = render(
      <CatalogPreview src="/api/media/audio-1" title="Audio basics" hasPodcast kind="audio" />,
    );

    expect(container.querySelector("audio")).toHaveAttribute("src", "/api/media/audio-1");
    expect(container.querySelector("video")).not.toBeInTheDocument();
    expect(screen.getByText("Like TAC audio preview")).toBeVisible();
  });

  test("stops an audio-only preview without reloading the recording", () => {
    const { container } = render(
      <CatalogPreview src="/api/media/audio-1" title="Audio basics" hasPodcast={false} kind="audio" />,
    );
    const audio = container.querySelector("audio") as HTMLAudioElement;
    const load = vi.fn();
    audio.pause = vi.fn();
    audio.load = load;
    audio.currentTime = 7;

    fireEvent.ended(audio);

    expect(audio.currentTime).toBe(0);
    expect(load).not.toHaveBeenCalled();
    expect(screen.getByText("Like TAC audio preview")).toBeVisible();
  });

  test("stops automatic motion when the visitor requests reduced motion", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { container } = render(
      <CatalogPreview src="/api/media/video-1" title="AI basics" hasPodcast kind="video" />,
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
      <CatalogPreview src="/media/podcast-opener/like-tac-podcast-opener.mp4" title="Coming soon" hasPodcast={false} kind="video" />,
    );
    const video = container.querySelector("video") as HTMLVideoElement;
    const unmute = screen.getByRole("button", { name: "Unmute preview" });

    fireEvent.click(unmute);
    expect(video.muted).toBe(false);
    expect(screen.getByRole("button", { name: "Mute preview" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /play|pause|full screen/i })).not.toBeInTheDocument();
  });
});
