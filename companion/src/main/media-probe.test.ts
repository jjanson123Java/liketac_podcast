import { describe, expect, test, vi } from "vitest";

import { probeMedia } from "./media-probe";

describe("media probe", () => {
  test("parses video, audio, and duration from FFprobe JSON", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: JSON.stringify({ format: { duration: "198.455", format_name: "mov,mp4" }, streams: [{ codec_type: "video" }, { codec_type: "audio" }] }), stderr: "" });
    await expect(probeMedia("episode.mp4", { run })).resolves.toMatchObject({ kind: "video", durationSeconds: 198.455, hasAudio: true, hasVideo: true });
    expect(run).toHaveBeenCalledWith("ffprobe", expect.arrayContaining(["-show_streams", "episode.mp4"]), expect.any(Object));
  });

  test("identifies audio-only input", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: JSON.stringify({ format: { duration: "62" }, streams: [{ codec_type: "audio" }] }), stderr: "" });
    await expect(probeMedia("episode.wav", { run })).resolves.toMatchObject({ kind: "audio", durationSeconds: 62, hasVideo: false });
  });

  test("rejects unsupported or invalid input", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: JSON.stringify({ format: { duration: "0" }, streams: [] }), stderr: "" });
    await expect(probeMedia("notes.txt", { run })).rejects.toThrow("UNSUPPORTED_MEDIA");
  });
});
