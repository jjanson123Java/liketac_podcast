import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PasswordField } from "./password-field";

describe("PasswordField", () => {
  test("reveals and hides the entered password without clearing it", () => {
    render(<PasswordField label="Password" name="password" />);
    const input = screen.getByLabelText("Password");

    fireEvent.change(input, { target: { value: "LikeTAC!2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("LikeTAC!2026");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("LikeTAC!2026");
  });
});
