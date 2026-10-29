import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ getSession }));

import HelpPage from "./page";

describe("role-aware Help", () => {
  beforeEach(() => getSession.mockReset());

  it("shows listener navigation, downloads, playback apps, and recovery guidance", async () => {
    getSession.mockResolvedValue(null);
    render(await HelpPage());
    expect(screen.getByRole("heading", { name: "Listen, learn, and find your way around." })).toBeInTheDocument();
    expect(screen.getByText(/VLC Media Player/)).toBeInTheDocument();
    expect(screen.getByText(/suggested strong password/)).toBeInTheDocument();
  });

  it("shows podcast, category, subscriber, Vercel, and security guidance to admins", async () => {
    getSession.mockResolvedValue({ role: "admin" });
    render(await HelpPage());
    expect(screen.getByRole("heading", { name: "Manage Like TAC with confidence." })).toBeInTheDocument();
    expect(screen.getByText(/Vercel does not directly manage Like TAC subscribers/)).toBeInTheDocument();
    expect(screen.getByText(/Coming Soon/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Like TAC Companion" })).toBeInTheDocument();
    expect(screen.getByText(/127\.0\.0\.1:4455/)).toBeInTheDocument();
  });
});
