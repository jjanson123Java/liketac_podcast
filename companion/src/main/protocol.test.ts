import { describe, expect, test } from "vitest";
import { allowedRendererNavigation, parseCompanionLaunch, parseUploadLaunch, resolveCloseAction } from "./protocol";

describe("Like TAC protocol security", () => {
  test.each(["liketac://recording", "LIKETAC://recording"])("accepts the exact recording action: %s", (url) => {
    expect(parseCompanionLaunch(url)).toBe("recording");
  });

  test.each([
    "liketac://recording/extra", "liketac://recording?url=https://evil.example", "liketac://admin",
    "https://liketac.live/admin/recording", "file:///recording", "not-a-url",
  ])("rejects unapproved launch input: %s", (url) => {
    expect(parseCompanionLaunch(url)).toBeNull();
  });

  test("strictly parses a Like TAC upload handoff without rendering its secret", () => {
    expect(parseUploadLaunch("liketac://prepare-upload?origin=https%3A%2F%2Fliketac.live&episodeId=86420552-d588-449f-a5ba-3ecac12bf373&secret=abcdefghijklmnopqrstuvwxyzABCDEFGH123456")).toEqual({
      origin: "https://liketac.live",
      episodeId: "86420552-d588-449f-a5ba-3ecac12bf373",
      secret: "abcdefghijklmnopqrstuvwxyzABCDEFGH123456",
    });
  });

  test.each([
    "liketac://prepare-upload?origin=https%3A%2F%2Fevil.example&episodeId=86420552-d588-449f-a5ba-3ecac12bf373&secret=abcdefghijklmnopqrstuvwxyzABCDEFGH123456",
    "liketac://prepare-upload?origin=https%3A%2F%2Fliketac.live&episodeId=not-a-uuid&secret=abcdefghijklmnopqrstuvwxyzABCDEFGH123456",
    "liketac://prepare-upload?origin=https%3A%2F%2Fliketac.live&episodeId=86420552-d588-449f-a5ba-3ecac12bf373&secret=short",
    "liketac://prepare-upload/extra?origin=https%3A%2F%2Fliketac.live&episodeId=86420552-d588-449f-a5ba-3ecac12bf373&secret=abcdefghijklmnopqrstuvwxyzABCDEFGH123456",
  ])("rejects an unsafe upload launch: %s", (url) => expect(parseUploadLaunch(url)).toBeNull());

  test("allows localhost only when an unpackaged development runtime opts in", () => {
    const local = "liketac://prepare-upload?origin=http%3A%2F%2F127.0.0.1%3A3100&episodeId=86420552-d588-449f-a5ba-3ecac12bf373&secret=abcdefghijklmnopqrstuvwxyzABCDEFGH123456";
    expect(parseUploadLaunch(local)).toBeNull();
    expect(parseUploadLaunch(local, { allowLocalDevelopment: true })).toMatchObject({ origin: "http://127.0.0.1:3100" });
  });

  test("allows only the packaged renderer URL", () => {
    const packaged = "file:///C:/Program%20Files/Like%20TAC%20Companion/resources/app/renderer/index.html";
    expect(allowedRendererNavigation(packaged, packaged)).toBe(true);
    expect(allowedRendererNavigation("https://liketac.live", packaged)).toBe(false);
    expect(allowedRendererNavigation(`${packaged}?remote=https://evil.example`, packaged)).toBe(false);
  });

  test.each([
    [{ recording: false, choice: "close" }, "close"],
    [{ recording: true, choice: "cancel" }, "cancel"],
    [{ recording: true, choice: "leave-recording" }, "close"],
    [{ recording: true, choice: "stop-recording" }, "stop-and-close"],
  ] as const)("resolves safe close choice %j", (input, expected) => {
    expect(resolveCloseAction(input)).toBe(expected);
  });
});
