import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { VisitorPlaybackNotice } from "./visitor-playback-notice";

describe("VisitorPlaybackNotice", () => {
  test("explains the visitor lock and provides signup and close actions", () => {
    const onClose = vi.fn();
    render(<VisitorPlaybackNotice episodeTitle="Building on the Basics" onClose={onClose} open />);

    expect(screen.getByRole("dialog", { name: "Building on the Basics requires membership" })).toBeVisible();
    expect(screen.getByText(/browsing as a visitor/i)).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign Up Free" })).toHaveAttribute("href", "/signup");
    fireEvent.click(screen.getByRole("button", { name: "Keep Browsing" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("closes with Escape", () => {
    const onClose = vi.fn();
    render(<VisitorPlaybackNotice episodeTitle="Building on the Basics" onClose={onClose} open />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
