import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MediaPlayer } from "./media-player";

describe("MediaPlayer", () => {
  test("uses native video controls without desktop-only fullscreen instructions", () => {
    const { container } = render(
      <MediaPlayer src="/api/media/start-here" kind="video" title="Start Here" />,
    );

    expect(container.querySelector("video")).toHaveAttribute("controls");
    expect(screen.queryByRole("button", { name: "Full screen" })).not.toBeInTheDocument();
    expect(screen.queryByText(/press escape/i)).not.toBeInTheDocument();
  });
});
