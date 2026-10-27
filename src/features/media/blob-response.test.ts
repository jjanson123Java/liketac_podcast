import { describe, expect, test } from "vitest";
import { readableBlobStatus } from "./blob-response";

describe("readableBlobStatus", () => {
  test.each([200, 206])("accepts Blob status %s", (status) => {
    expect(readableBlobStatus(status)).toBe(true);
  });

  test.each([204, 404, 500])("rejects Blob status %s", (status) => {
    expect(readableBlobStatus(status)).toBe(false);
  });
});
