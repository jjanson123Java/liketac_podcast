import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { TrashRestoreCard } from "./trash-restore-card";

test("offers a restore action for deleted admin content", () => {
  render(<TrashRestoreCard endpoint="/api/admin/podcasts" id="episode-1" title="Deleted episode" />);

  expect(screen.getByRole("heading", { name: "Deleted episode" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  expect(screen.getByDisplayValue("restore")).toHaveAttribute("name", "action");
});
