import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import ResetPage from "@/app/account/reset/page";
import AdminChangePasswordPage from "@/app/admin/change-password/page";
import AdminResetPage from "@/app/admin/reset/page";
import AdminSignInPage from "@/app/admin/sign-in/page";
import SignupPage from "@/app/signup/page";

vi.mock("@/features/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({ role: "admin" }),
}));

describe("password visibility controls across account forms", () => {
  test("signup exposes a control for each password field", () => {
    render(<SignupPage />);
    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(2);
  });

  test("member reset exposes a control for each password field", async () => {
    render(await ResetPage({ searchParams: Promise.resolve({ token: "reset-token" }) }));
    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(2);
  });

  test("admin sign in exposes a password visibility control", () => {
    render(<AdminSignInPage />);
    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
  });

  test("admin reset exposes a control for each password field", async () => {
    render(await AdminResetPage({ searchParams: Promise.resolve({ token: "reset-token" }) }));
    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(2);
  });

  test("required admin password change exposes a control for each password field", async () => {
    render(await AdminChangePasswordPage());
    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(2);
  });
});
