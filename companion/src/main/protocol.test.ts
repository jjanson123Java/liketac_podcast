import { describe, expect, test } from "vitest";
import { allowedRendererNavigation, parseCompanionLaunch, resolveCloseAction } from "./protocol";

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
