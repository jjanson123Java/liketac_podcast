import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import WhoItsForPage from "./page";

describe("Who Like TAC is for", () => {
  test("welcomes people across experience levels without putting them in boxes", () => {
    render(<WhoItsForPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Who is Like TAC for?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Curious and capable" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Serious tech. Human delivery." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "New platform. Faster bearings." })).toBeInTheDocument();
  });

  test("continues into the existing archive and signup journeys", () => {
    render(<WhoItsForPage />);

    expect(screen.getByRole("link", { name: "Explore the Archive" })).toHaveAttribute("href", "/shows");
    expect(screen.getByRole("link", { name: "Sign Up Free" })).toHaveAttribute("href", "/signup");
  });
});
