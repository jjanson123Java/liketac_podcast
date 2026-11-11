import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test, vi } from "vitest";

import { generatePreview } from "./preview-generator";

async function fixtureDirectory() {
  const directory = join(tmpdir(), `liketac-preview-test-${crypto.randomUUID()}`);
  await mkdir(directory, { recursive: true });
  const sourcePath = join(directory, "source.mp4");
  await writeFile(sourcePath, "original-source");
  return { directory, sourcePath };
}

describe("local preview generator", () => {
  test("uses the first 45 seconds with NVENC and reports progress", async () => {
    const { directory, sourcePath } = await fixtureDirectory();
    const onProgress = vi.fn();
    const run = vi.fn(async (executable: string, args: string[], options: { onStderr?: (line: string) => void }) => {
      if (executable === "ffprobe") return { stdout: JSON.stringify({ format: { duration: "198.455" }, streams: [{ codec_type: "video" }, { codec_type: "audio" }] }), stderr: "" };
      options.onStderr?.("out_time_ms=22500000");
      await writeFile(args.at(-1)!, "preview");
      return { stdout: "", stderr: "" };
    });
    const result = await generatePreview({ sourcePath, outputDirectory: directory, onProgress }, { run });
    expect(run).toHaveBeenCalledWith("ffmpeg", expect.arrayContaining(["-t", "45", "-c:v", "h264_nvenc"]), expect.any(Object));
    expect(result).toMatchObject({ kind: "video", durationSeconds: 45, encoder: "nvenc" });
    expect(onProgress).toHaveBeenCalledWith(50);
    expect(await readFile(sourcePath, "utf8")).toBe("original-source");
  });

  test("ends at source EOF and creates an audio teaser for audio-only input", async () => {
    const { directory, sourcePath } = await fixtureDirectory();
    const run = vi.fn(async (executable: string, args: string[]) => {
      if (executable === "ffprobe") return { stdout: JSON.stringify({ format: { duration: "12.5" }, streams: [{ codec_type: "audio" }] }), stderr: "" };
      await writeFile(args.at(-1)!, "preview");
      return { stdout: "", stderr: "" };
    });
    const result = await generatePreview({ sourcePath, outputDirectory: directory }, { run });
    expect(run).toHaveBeenCalledWith("ffmpeg", expect.arrayContaining(["-t", "12.5", "-c:a", "aac"]), expect.any(Object));
    expect(result).toMatchObject({ kind: "audio", durationSeconds: 12.5 });
    expect(result.outputPath.endsWith(".m4a")).toBe(true);
  });

  test("falls back to CPU video encoding when NVENC is unavailable", async () => {
    const { directory, sourcePath } = await fixtureDirectory();
    let ffmpegRuns = 0;
    const run = vi.fn(async (executable: string, args: string[]) => {
      if (executable === "ffprobe") return { stdout: JSON.stringify({ format: { duration: "50" }, streams: [{ codec_type: "video" }] }), stderr: "" };
      ffmpegRuns += 1;
      if (args.includes("h264_nvenc")) throw new Error("NVENC unavailable");
      await writeFile(args.at(-1)!, "preview");
      return { stdout: "", stderr: "" };
    });
    const result = await generatePreview({ sourcePath, outputDirectory: directory }, { run });
    expect(ffmpegRuns).toBe(2);
    expect(result.encoder).toBe("cpu");
    expect(run).toHaveBeenCalledWith("ffmpeg", expect.arrayContaining(["-c:v", "libx264"]), expect.any(Object));
  });

  test("cleans partial output after failure without changing the source", async () => {
    const { directory, sourcePath } = await fixtureDirectory();
    const run = vi.fn(async (executable: string) => {
      if (executable === "ffprobe") return { stdout: JSON.stringify({ format: { duration: "50" }, streams: [{ codec_type: "video" }] }), stderr: "" };
      throw new Error("encoding failed");
    });
    await expect(generatePreview({ sourcePath, outputDirectory: directory }, { run })).rejects.toThrow("encoding failed");
    expect(await readFile(sourcePath, "utf8")).toBe("original-source");
  });
});
