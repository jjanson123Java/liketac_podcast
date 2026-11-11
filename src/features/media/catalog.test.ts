import { describe, expect, test } from "vitest";
import { selectNewestMediaPair } from "./catalog-preview";

describe("selectNewestMediaPair", () => {
  test("returns the newest full recording and teaser independently", () => {
    const pair = selectNewestMediaPair([
      { id: "old-video", episodeId: "episode-1", kind: "video", mimeType: "video/mp4", createdAt: new Date("2026-01-01") },
      { id: "new-video", episodeId: "episode-1", kind: "video", mimeType: "video/mp4", createdAt: new Date("2026-01-03") },
      { id: "new-teaser", episodeId: "episode-1", kind: "teaser", mimeType: "video/mp4", createdAt: new Date("2026-01-04") },
    ]);

    expect(pair.full?.id).toBe("new-video");
    expect(pair.teaser?.id).toBe("new-teaser");
  });
});
