import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import HomePage from "./page";

describe("Like TAC public landing page", () => {
  test("states the approved promise and audience without inviting subscribers to create podcasts", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Serious tech\.\s*For the rest of us\./,
    );
    expect(screen.getByText(/technical people approaching an unfamiliar/i)).toBeVisible();
    expect(screen.getByText(/beginner or nontechnical/i)).toBeVisible();
    expect(screen.queryByText(/start a podcast/i)).not.toBeInTheDocument();
  });

  test("provides working destinations for the public primary actions", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /browse all shows/i })).toHaveAttribute(
      "href",
      "/shows",
    );
    expect(screen.getByRole("link", { name: /sign up free/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
