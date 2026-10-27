import { describe, expect, it } from "vitest";
import { validateUpload } from "./upload";

describe("podcast upload validation", () => {
  it("accepts supported audio, video, teaser, caption, and transcript uploads", () => {
    expect(validateUpload({ pathname: "episodes/abc/main.mp4", contentType: "video/mp4", size: 1_000 }, "video")).toEqual([]);
    expect(validateUpload({ pathname: "episodes/abc/teaser.mp4", contentType: "video/mp4", size: 1_000 }, "teaser")).toEqual([]);
    expect(validateUpload({ pathname: "episodes/abc/captions.vtt", contentType: "text/vtt", size: 1_000 }, "captions")).toEqual([]);
  });

  it("rejects traversal, misleading MIME types, and oversized files", () => {
    expect(validateUpload({ pathname: "../secret.mp4", contentType: "video/mp4", size: 1_000 }, "video")).toContain("The object path is unsafe.");
    expect(validateUpload({ pathname: "episodes/a/video.exe", contentType: "application/octet-stream", size: 1_000 }, "video")).toContain("That file type is not allowed for this media role.");
    expect(validateUpload({ pathname: "episodes/a/video.mp4", contentType: "video/mp4", size: 6_000_000_000 }, "video")).toContain("The file is larger than the allowed limit.");
  });
});
