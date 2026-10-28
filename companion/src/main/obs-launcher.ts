import { win32 } from "node:path";

export type OBSOutputState = { recording: boolean; streaming: boolean };
export type OBSLaunchSpec = { executable: string; workingDirectory: string; arguments: string[] };

export function buildOBSLaunchSpec(executable: string): OBSLaunchSpec {
  return {
    executable,
    workingDirectory: win32.dirname(executable),
    arguments: ["--profile", "LikeTACLive", "--collection", "LikeTACLive Studio", "--scene", "00 - Standby"],
  };
}

export function mayRelaunchOBS(output: OBSOutputState) {
  return !output.recording && !output.streaming;
}

const STANDARD_OBS_PATHS = [
  "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe",
  "C:\\Program Files (x86)\\obs-studio\\bin\\64bit\\obs64.exe",
];

type LauncherDependencies = {
  exists(path: string): Promise<boolean>;
  spawn(executable: string, arguments_: string[], options: { cwd: string; windowsHide: boolean }): unknown;
};

export class OBSLauncher {
  constructor(private readonly dependencies: LauncherDependencies) {}

  async discover() {
    for (const path of STANDARD_OBS_PATHS) {
      if (await this.dependencies.exists(path)) return path;
    }
    return null;
  }

  launch(executable: string) {
    const spec = buildOBSLaunchSpec(executable);
    return this.dependencies.spawn(spec.executable, spec.arguments, {
      cwd: spec.workingDirectory,
      windowsHide: false,
    });
  }
}
