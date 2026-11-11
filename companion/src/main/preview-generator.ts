import { rename, rm } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomUUID } from "node:crypto";

import type { GeneratedPreview } from "../shared/contracts";
import { probeMedia, runCommand, type CommandRunner } from "./media-probe";

type GeneratePreviewInput = {
  sourcePath: string;
  outputDirectory: string;
  signal?: AbortSignal;
  onProgress?: (percentage: number) => void;
};

export async function generatePreview(
  input: GeneratePreviewInput,
  dependencies: { run?: CommandRunner } = {},
): Promise<GeneratedPreview> {
  const run = dependencies.run ?? runCommand;
  const probe = await probeMedia(input.sourcePath, { run });
  const durationSeconds = Math.min(45, probe.durationSeconds);
  const extension = probe.kind === "video" ? ".mp4" : ".m4a";
  const stem = basename(input.sourcePath, extname(input.sourcePath)).replace(/[^A-Za-z0-9._-]/g, "-");
  const unique = randomUUID();
  const partialPath = join(input.outputDirectory, `${stem}-preview-${unique}.partial${extension}`);
  const outputPath = join(input.outputDirectory, `${stem}-preview-${unique}${extension}`);
  let lastProgress = -1;
  const reportProgress = (progress: number) => {
    if (progress === lastProgress) return;
    lastProgress = progress;
    input.onProgress?.(progress);
  };
  const onStderr = (line: string) => {
    const match = /^out_time_(?:ms|us)=(\d+)$/.exec(line.trim());
    if (!match) return;
    const elapsedSeconds = Number(match[1]) / 1_000_000;
    reportProgress(Math.max(0, Math.min(100, Math.round((elapsedSeconds / durationSeconds) * 100))));
  };
  const common = ["-y", "-i", input.sourcePath, "-t", String(durationSeconds), "-map_metadata", "-1", "-progress", "pipe:2", "-nostats"];

  try {
    if (probe.kind === "audio") {
      await run("ffmpeg", [...common, "-vn", "-c:a", "aac", "-b:a", "192k", partialPath], { signal: input.signal, onStderr });
      await rename(partialPath, outputPath);
      reportProgress(100);
      return { outputPath, kind: "audio", durationSeconds, encoder: "aac" };
    }

    const audioArguments = probe.hasAudio ? ["-c:a", "aac", "-b:a", "192k"] : ["-an"];
    let encoder: "nvenc" | "cpu" = "nvenc";
    try {
      await run("ffmpeg", [...common, "-c:v", "h264_nvenc", "-preset", "p4", "-cq", "23", ...audioArguments, "-movflags", "+faststart", partialPath], { signal: input.signal, onStderr });
    } catch (nvencError) {
      if (input.signal?.aborted) throw nvencError;
      await rm(partialPath, { force: true });
      encoder = "cpu";
      await run("ffmpeg", [...common, "-c:v", "libx264", "-preset", "medium", "-crf", "23", ...audioArguments, "-movflags", "+faststart", partialPath], { signal: input.signal, onStderr });
    }
    await rename(partialPath, outputPath);
    reportProgress(100);
    return { outputPath, kind: "video", durationSeconds, encoder };
  } catch (error) {
    await rm(partialPath, { force: true });
    await rm(outputPath, { force: true });
    throw error;
  }
}
