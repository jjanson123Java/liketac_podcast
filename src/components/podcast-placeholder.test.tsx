import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PodcastPlaceholder } from "./podcast-placeholder";

describe("PodcastPlaceholder", () => {
  test("keeps normal controls on the episode page for a subject awaiting its podcast", () => {
    const { container } = render(<PodcastPlaceholder subject="Deploying and Configuring Expressway" />);

    expect(screen.getByRole("heading", { name: "Podcast coming soon" })).toBeVisible();
    expect(screen.getByText(/will be replaced by the complete episode/i)).toBeVisible();

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "/media/podcast-opener/like-tac-podcast-opener.mp4");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("aria-label", "Deploying and Configuring Expressway podcast preview");
  });

  test("uses only mute or unmute on the catalog version", () => {
    const { container } = render(
      <PodcastPlaceholder subject="Deploying and Configuring Expressway" catalogPreview />,
    );

    expect(container.querySelector("video")).not.toHaveAttribute("controls");
    expect(screen.getByRole("button", { name: "Unmute preview" })).toBeVisible();
  });
});
