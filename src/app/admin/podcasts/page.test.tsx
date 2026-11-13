import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { db, getSessionMock } = vi.hoisted(() => ({
  db: { select: vi.fn() },
  getSessionMock: vi.fn(),
}));

vi.mock("@/db/content/client", () => ({ createContentDb: () => db }));
vi.mock("@/features/auth/session", () => ({ getSession: () => getSessionMock() }));
vi.mock("@/components/admin-media-upload", () => ({ AdminMediaUpload: () => null }));
vi.mock("@/components/companion-media-upload", () => ({ CompanionMediaUpload: () => null }));

import PodcastsPage from "./page";

const categories = [
  { id: "start", name: "Start Here", sortOrder: 0, deletedAt: null },
  { id: "ai", name: "AI in Plain English", sortOrder: 1, deletedAt: null },
];
const episode = {
  id: "episode-1",
  categoryId: "start",
  title: "Episode 1 AI Demystifying The Brain",
  summary: "AI explained clearly.",
  status: "draft",
  deletedAt: null,
  createdAt: new Date("2026-11-13T12:46:26Z"),
};

describe("administrator episode categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ role: "admin", mustChangePassword: false });
    db.select
      .mockReturnValueOnce({ from: () => ({ orderBy: async () => categories }) })
      .mockReturnValueOnce({ from: () => ({ orderBy: async () => [episode] }) })
      .mockReturnValueOnce({ from: () => ({ orderBy: async () => [] }) });
  });

  test("shows the current category as an editable dropdown on each episode card", async () => {
    render(await PodcastsPage());

    const card = screen.getByRole("heading", { name: episode.title }).closest("article");
    expect(card).not.toBeNull();
    const category = within(card as HTMLElement).getByRole("combobox", { name: "Category" });
    expect(category).toHaveValue("start");
    expect(within(card as HTMLElement).getByRole("option", { name: "AI in Plain English" })).toBeVisible();
    expect(within(card as HTMLElement).getByRole("button", { name: "Move episode" })).toBeVisible();
  });

  test("labels the new-episode category selector as Categories", async () => {
    render(await PodcastsPage());

    expect(screen.getByRole("combobox", { name: "Categories" })).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Subject" })).not.toBeInTheDocument();
  });
});
