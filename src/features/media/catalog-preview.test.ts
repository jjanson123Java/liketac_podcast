import { describe, expect, test } from "vitest";

import { selectCatalogPreview } from "./catalog-preview";

const media = [
  { id: "full-video", episodeId: "episode-1", kind: "video" as const },
  { id: "teaser-video", episodeId: "episode-1", kind: "teaser" as const },
];

describe("selectCatalogPreview", () => {
  test("uses full video for a free episode and teaser-only media for protected archive listings", () => {
    expect(selectCatalogPreview({ accessLevel: "public", isStartHere: false, isCurrent: false }, media)?.id).toBe("full-video");
    expect(selectCatalogPreview({ accessLevel: "subscriber", isStartHere: false, isCurrent: false }, media)?.id).toBe("teaser-video");
  });

  test("does not expose a protected full recording when no teaser was uploaded", () => {
    expect(selectCatalogPreview(
      { accessLevel: "subscriber", isStartHere: false, isCurrent: false },
      media.filter((item) => item.kind === "video"),
    )).toBeNull();
  });
});
