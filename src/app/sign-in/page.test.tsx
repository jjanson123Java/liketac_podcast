import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import SignInPage from "./page";

describe("member sign in password visibility", () => {
  test("offers a control to reveal the password", () => {
    render(<SignInPage />);

    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
  });
});
