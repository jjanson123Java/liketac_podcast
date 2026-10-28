import { describe, expect, test } from "vitest";

import { catalogPreviewKind, selectCatalogPreview } from "./catalog-preview";

const media = [
  { id: "full-video", episodeId: "episode-1", kind: "video" as const, mimeType: "video/mp4" },
  { id: "full-audio", episodeId: "episode-1", kind: "audio" as const, mimeType: "audio/mpeg" },
  { id: "teaser-video", episodeId: "episode-1", kind: "teaser" as const, mimeType: "video/mp4" },
];

describe("selectCatalogPreview", () => {
  test("uses full video for a free episode and teaser-only media for protected archive listings", () => {
    expect(selectCatalogPreview({ accessLevel: "public", isStartHere: false, isCurrent: false }, media)?.id).toBe("full-video");
    expect(selectCatalogPreview({ accessLevel: "subscriber", isStartHere: false, isCurrent: false }, media)?.id).toBe("teaser-video");
  });

  test("uses an audio recording when a free episode has no video", () => {
    const audioOnly = media.filter((item) => item.kind === "audio");
    expect(selectCatalogPreview({ accessLevel: "public", isStartHere: false, isCurrent: false }, audioOnly)?.id).toBe("full-audio");
  });

  test("keeps a protected audio teaser in audio preview mode", () => {
    const audioTeaser = [{ id: "audio-teaser", episodeId: "episode-1", kind: "teaser" as const, mimeType: "audio/mpeg" }];
    const preview = selectCatalogPreview({ accessLevel: "subscriber", isStartHere: false, isCurrent: false }, audioTeaser);
    expect(preview?.id).toBe("audio-teaser");
    expect(catalogPreviewKind(preview?.mimeType)).toBe("audio");
  });

  test("does not expose a protected full recording when no teaser was uploaded", () => {
    expect(selectCatalogPreview(
      { accessLevel: "subscriber", isStartHere: false, isCurrent: false },
      media.filter((item) => item.kind === "video" || item.kind === "audio"),
    )).toBeNull();
  });
});
