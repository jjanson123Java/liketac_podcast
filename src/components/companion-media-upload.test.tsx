import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { CompanionMediaUpload } from "./companion-media-upload";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

test("creates a short-lived handoff and launches Companion without displaying its secret", async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "handoff-1", secret: "abcdefghijklmnopqrstuvwxyzABCDEFGH123456", episodeId: "86420552-d588-449f-a5ba-3ecac12bf373", expiresAt: "2026-11-11T12:10:00Z" }) });
  const launch = vi.fn();
  render(<CompanionMediaUpload episodeId="86420552-d588-449f-a5ba-3ecac12bf373" hasFull={false} hasPreview={false} launch={launch} />);

  fireEvent.click(screen.getByRole("button", { name: "Prepare and upload with Like TAC Companion" }));
  await waitFor(() => expect(launch).toHaveBeenCalledWith(expect.stringMatching(/^liketac:\/\/prepare-upload\?/)));
  expect(launch.mock.calls[0][0]).toContain("episodeId=86420552-d588-449f-a5ba-3ecac12bf373");
  expect(document.body).not.toHaveTextContent("abcdefghijklmnopqrstuvwxyzABCDEFGH123456");
  expect(screen.getByText(/Handoff ready for 10 minutes/i)).toBeVisible();
});

test("shows full and preview readiness", () => {
  render(<CompanionMediaUpload episodeId="episode-1" hasFull hasPreview launch={vi.fn()} />);
  expect(screen.getByText("Full episode ready")).toBeVisible();
  expect(screen.getByText("45-second preview ready")).toBeVisible();
});

test("updates readiness from handoff status without exposing the secret", async () => {
  fetchMock
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "handoff-1", secret: "abcdefghijklmnopqrstuvwxyzABCDEFGH123456", episodeId: "86420552-d588-449f-a5ba-3ecac12bf373" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fullComplete: true, teaserComplete: true, cancelled: false }) });
  render(<CompanionMediaUpload episodeId="86420552-d588-449f-a5ba-3ecac12bf373" hasFull={false} hasPreview={false} launch={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Prepare and upload with Like TAC Companion" }));
  expect(await screen.findByText("Full episode and 45-second preview are ready. You can publish the episode.")).toBeVisible();
  expect(screen.getByText("Full episode ready")).toBeVisible();
  expect(screen.getByText("45-second preview ready")).toBeVisible();
});
