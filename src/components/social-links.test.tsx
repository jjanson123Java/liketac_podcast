import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SocialLinks } from "./social-links";

describe("SocialLinks", () => {
  test("renders configured services and omits blank or unsafe entries", () => {
    render(
      <SocialLinks
        links={[
          { service: "YouTube", label: "@NextLevelCast", url: "https://youtube.com/@NextLevelCast" },
          { service: "Twitch", label: "", url: "" },
          { service: "Discord", label: "community", url: "javascript:alert(1)" },
        ]}
      />,
    );

    const youtube = screen.getByRole("link", { name: "YouTube: @NextLevelCast" });
    expect(youtube).toHaveAttribute("href", "https://youtube.com/@NextLevelCast");
    expect(youtube).toHaveAttribute("target", "_blank");
    expect(youtube).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText(/Twitch/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Discord/)).not.toBeInTheDocument();
  });

  test("renders nothing when no accounts are configured", () => {
    const { container } = render(<SocialLinks links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
