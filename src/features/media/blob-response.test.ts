import { describe, expect, test } from "vitest";
import { mediaResponseStatus, readableBlobStatus } from "./blob-response";

describe("readableBlobStatus", () => {
  test.each([200, 206])("accepts Blob status %s", (status) => {
    expect(readableBlobStatus(status)).toBe(true);
  });

  test.each([204, 404, 500])("rejects Blob status %s", (status) => {
    expect(readableBlobStatus(status)).toBe(false);
  });
});

describe("mediaResponseStatus", () => {
  test("returns partial-content status when the browser requested a byte range", () => {
    expect(mediaResponseStatus(true, 200)).toBe(206);
  });

  test("preserves a complete Blob response status when no range was requested", () => {
    expect(mediaResponseStatus(false, 200)).toBe(200);
  });
});
