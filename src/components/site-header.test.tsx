import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { SiteHeader } from "./site-header";

describe("SiteHeader authentication controls", () => {
  test("offers sign in and free signup to visitors", () => {
    render(<SiteHeader role={null} />);

    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "Sign Up Free" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("button", { name: "Sign Out" })).not.toBeInTheDocument();
  });

  test("offers sign out instead of signup to subscribers", () => {
    render(<SiteHeader role="subscriber" />);

    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign In" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign Up Free" })).not.toBeInTheDocument();
  });

  test("adds the dashboard link for administrators", () => {
    render(<SiteHeader role="admin" />);

    expect(screen.getByRole("link", { name: "Admin Dashboard" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });
});
