import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ShowsCatalog, type ShowsCatalogCategory } from "./shows-catalog";

const baseEpisode = {
  summary: "Summary",
  publishedAt: new Date("2026-11-13T12:00:00Z"),
  isStartHere: false,
  isCurrent: false,
  access: "full" as const,
  hasMedia: true,
  previewMediaId: null,
  previewMediaKind: "video" as const,
  isFreeClassification: false,
  isNonTechnical: false,
  isBeginner: false,
  isSeriously: false,
};

const catalog: ShowsCatalogCategory[] = [
  {
    id: "ai",
    name: "AI in Plain English",
    description: "AI concepts made useful.",
    episodes: [
      { ...baseEpisode, id: "brain", slug: "brain", title: "Demystifying the Brain", isFreeClassification: true, isNonTechnical: true },
      { ...baseEpisode, id: "basics", slug: "basics", title: "Building on the Basics", access: "teaser", isBeginner: true, isSeriously: true },
    ],
  },
  {
    id: "expressway",
    name: "Deploying Expressway",
    description: "Deployment conversations.",
    episodes: [{ ...baseEpisode, id: "deploy", slug: "deploy", title: "Deploy with Confidence", access: "teaser", isSeriously: true }],
  },
];

describe("ShowsCatalog classifications", () => {
  test("renders the four filters in the approved order and shows everything initially", () => {
    render(<ShowsCatalog catalog={catalog} isSubscriber={false} />);

    expect(screen.getAllByRole("button", { name: /Episodes$/ }).map((button) => button.textContent)).toEqual([
      "Free Episodes",
      "Non-Technical Episodes",
      "Beginner Episodes",
      "Seriously Episodes",
    ]);
    expect(screen.getByText("Demystifying the Brain")).toBeVisible();
    expect(screen.getByText("Building on the Basics")).toBeVisible();
    expect(screen.getByText("Deploy with Confidence")).toBeVisible();
  });

  test("uses OR matching for multiple selected filters and restores all episodes when cleared", () => {
    render(<ShowsCatalog catalog={catalog} isSubscriber={false} />);
    const free = screen.getByRole("button", { name: "Free Episodes" });
    const beginner = screen.getByRole("button", { name: "Beginner Episodes" });

    fireEvent.click(free);
    expect(free).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Demystifying the Brain")).toBeVisible();
    expect(screen.queryByText("Building on the Basics")).not.toBeInTheDocument();

    fireEvent.click(beginner);
    expect(screen.getByText("Demystifying the Brain")).toBeVisible();
    expect(screen.getByText("Building on the Basics")).toBeVisible();
    expect(screen.queryByText("Deploy with Confidence")).not.toBeInTheDocument();

    fireEvent.click(free);
    fireEvent.click(beginner);
    expect(screen.getByText("Deploy with Confidence")).toBeVisible();
  });

  test("keeps categories visible and explains when none of their episodes match", () => {
    render(<ShowsCatalog catalog={catalog} isSubscriber={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Free Episodes" }));

    const expressway = screen.getByRole("heading", { name: "Deploying Expressway" }).closest("section");
    expect(expressway).not.toBeNull();
    expect(within(expressway as HTMLElement).getByText("No episodes in this category match the selected filters.")).toBeVisible();
  });
});
