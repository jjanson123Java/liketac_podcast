import { spawn } from "node:child_process";

import type { MediaProbe } from "../shared/contracts";

export type CommandOptions = {
  signal?: AbortSignal;
  onStderr?: (line: string) => void;
};

export type CommandResult = { stdout: string; stderr: string };
export type CommandRunner = (executable: string, arguments_: string[], options: CommandOptions) => Promise<CommandResult>;

export const runCommand: CommandRunner = (executable, arguments_, options) => new Promise((resolve, reject) => {
  const child = spawn(executable, arguments_, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], signal: options.signal });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    stderr += text;
    for (const line of text.split(/\r?\n/)) if (line) options.onStderr?.(line);
  });
  child.once("error", reject);
  child.once("close", (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${executable} exited with code ${code}: ${stderr.trim()}`)));
});

export async function probeMedia(sourcePath: string, dependencies: { run?: CommandRunner } = {}): Promise<MediaProbe> {
  const run = dependencies.run ?? runCommand;
  let result: CommandResult;
  try {
    result = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", sourcePath], {});
  } catch (error) {
    throw new Error("FFPROBE_UNAVAILABLE", { cause: error });
  }

  let data: { format?: { duration?: string; format_name?: string }; streams?: Array<{ codec_type?: string }> };
  try {
    data = JSON.parse(result.stdout) as typeof data;
  } catch (error) {
    throw new Error("INVALID_MEDIA_METADATA", { cause: error });
  }
  const durationSeconds = Number(data.format?.duration ?? 0);
  const hasVideo = data.streams?.some((stream) => stream.codec_type === "video") ?? false;
  const hasAudio = data.streams?.some((stream) => stream.codec_type === "audio") ?? false;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || (!hasVideo && !hasAudio)) throw new Error("UNSUPPORTED_MEDIA");
  return { sourcePath, kind: hasVideo ? "video" : "audio", durationSeconds, hasVideo, hasAudio, formatName: data.format?.format_name ?? null };
}
