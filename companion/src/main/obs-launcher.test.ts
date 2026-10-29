import { describe, expect, test } from "vitest";
import { vi } from "vitest";
import { buildOBSLaunchSpec, mayRelaunchOBS, OBSLauncher } from "./obs-launcher";

describe("OBS launcher", () => {
  test("builds the verified Windows launch without auto-recording", () => {
    const executable = "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe";
    expect(buildOBSLaunchSpec(executable)).toEqual({
      executable,
      workingDirectory: "C:\\Program Files\\obs-studio\\bin\\64bit",
      arguments: ["--profile", "LikeTACLive", "--collection", "LikeTACLive Studio", "--scene", "00 - Standby"],
    });
  });

  test.each([
    [{ recording: true, streaming: false }, false],
    [{ recording: false, streaming: true }, false],
    [{ recording: false, streaming: false }, true],
  ])("protects active OBS output before relaunch: %j", (output, allowed) => {
    expect(mayRelaunchOBS(output)).toBe(allowed);
  });

  test("discovers and launches the standard 64-bit installation with its required working directory", async () => {
    const spawn = vi.fn();
    const launcher = new OBSLauncher({ exists: async (path) => path === "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe", spawn });
    const executable = await launcher.discover();
    expect(executable).toBe("C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe");
    launcher.launch(executable!);
    expect(spawn).toHaveBeenCalledWith(
      executable,
      ["--profile", "LikeTACLive", "--collection", "LikeTACLive Studio", "--scene", "00 - Standby"],
      { cwd: "C:\\Program Files\\obs-studio\\bin\\64bit", windowsHide: false },
    );
  });
});
