import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import HomePage from "./page";

const getSessionMock = vi.fn();
const getCatalogMock = vi.fn();

vi.mock("@/features/auth/session", () => ({ getSession: () => getSessionMock() }));
vi.mock("@/features/media/catalog", () => ({ getCatalog: () => getCatalogMock() }));

const episodes = [
  { id: "start", slug: "tech-at-lunch", title: "Start Here", isStartHere: true, accessLevel: "subscriber", status: "published", publishedAt: new Date("2026-01-01") },
  { id: "latest", slug: "latest-ai", title: "Latest AI", isStartHere: false, accessLevel: "subscriber", status: "published", publishedAt: new Date("2026-02-01") },
];

beforeEach(() => {
  getSessionMock.mockResolvedValue(null);
  getCatalogMock.mockResolvedValue([{ id: "category", episodes }]);
});

describe("Like TAC landing page", () => {
  test("directs a visitor to Start Here and provides a sign-in cue", async () => {
    render(await HomePage());
    expect(screen.getByRole("link", { name: "Start Here — Watch Free" })).toHaveAttribute("href", "/shows/tech-at-lunch");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  });

  test("directs an active subscriber to the latest published episode", async () => {
    getSessionMock.mockResolvedValue({ role: "subscriber", status: "active" });
    render(await HomePage());
    expect(screen.getByRole("link", { name: "Play Latest Episode" })).toHaveAttribute("href", "/shows/latest-ai");
  });

  test("directs an administrator to the dashboard", async () => {
    getSessionMock.mockResolvedValue({ role: "admin", status: "active" });
    render(await HomePage());
    expect(screen.getByRole("link", { name: "Open Admin Dashboard" })).toHaveAttribute("href", "/admin");
  });

  test("falls back to the catalog when no appropriate episode is published", async () => {
    getCatalogMock.mockResolvedValue([]);
    render(await HomePage());
    expect(screen.getByRole("link", { name: "Browse Free Episodes" })).toHaveAttribute("href", "/shows");
  });

  test("keeps the approved promise and supporting destinations", async () => {
    render(await HomePage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Serious tech\.\s*For the rest of us\./);
    expect(screen.getByRole("link", { name: /browse all shows/i })).toHaveAttribute("href", "/shows");
    expect(screen.getByRole("link", { name: /sign up free/i })).toHaveAttribute("href", "/signup");
    expect(screen.queryByText(/start a podcast/i)).not.toBeInTheDocument();
  });
});
