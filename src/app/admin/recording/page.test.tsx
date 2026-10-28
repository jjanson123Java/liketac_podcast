import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ getSession }));

import AdminDashboard from "../page";
import RecordingStudioPage from "./page";

describe("protected Like TAC Companion launcher", () => {
  beforeEach(() => getSession.mockResolvedValue({ role: "admin", mustChangePassword: false }));

  test("adds Recording Studio to the administrator dashboard", async () => {
    render(await AdminDashboard());
    expect(screen.getByRole("link", { name: /Recording Studio/i })).toHaveAttribute("href", "/admin/recording");
  });

  test("launches only the registered local Companion action and explains readiness", async () => {
    render(await RecordingStudioPage());
    expect(screen.getByRole("heading", { name: "Like TAC Recording Studio" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Launch Like TAC Companion" })).toHaveAttribute("href", "liketac://recording");
    expect(screen.getByText(/Profile: LikeTACLive/)).toBeVisible();
    expect(screen.getByText(/Scene collection: LikeTACLive Studio/)).toBeVisible();
    expect(screen.getByText(/starts OBS when it is not running/i)).toBeVisible();
    expect(screen.getByText(/never sent to Vercel/i)).toBeVisible();
    expect(screen.getByText(/liketac-banner-hd.png/)).toBeVisible();
    expect(screen.getByText(/like-tac-podcast-opener.mp4/)).toBeVisible();
  });
});
