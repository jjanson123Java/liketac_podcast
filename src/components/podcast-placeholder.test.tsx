import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PodcastPlaceholder } from "./podcast-placeholder";

describe("PodcastPlaceholder", () => {
  test("plays the approved Like TAC intro for a subject awaiting its podcast", () => {
    const { container } = render(<PodcastPlaceholder subject="Deploying and Configuring Expressway" />);

    expect(screen.getByRole("heading", { name: "Podcast coming soon" })).toBeVisible();
    expect(screen.getByText(/will be replaced by the complete episode/i)).toBeVisible();

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "/media/podcast-opener/like-tac-podcast-opener.mp4");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("aria-label", "Deploying and Configuring Expressway podcast preview");
  });
});
