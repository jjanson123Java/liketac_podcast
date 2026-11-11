import { describe, expect, test, vi } from "vitest";

import { MediaUploadJob } from "./media-upload-job";

const launch = {
  origin: "https://liketac.live",
  episodeId: "86420552-d588-449f-a5ba-3ecac12bf373",
  secret: "abcdefghijklmnopqrstuvwxyzABCDEFGH123456",
};

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    selectFile: vi.fn(async () => "C:\\Podcasts\\episode.mp4"),
    makeTempDirectory: vi.fn(async () => "C:\\Temp\\liketac-upload"),
    probe: vi.fn(async () => ({ sourcePath: "C:\\Podcasts\\episode.mp4", kind: "video" as const, durationSeconds: 180, hasVideo: true, hasAudio: true, formatName: "mp4" })),
    generate: vi.fn(async () => ({ outputPath: "C:\\Temp\\liketac-upload\\preview.mp4", kind: "video" as const, durationSeconds: 45, encoder: "nvenc" as const })),
    upload: vi.fn(async () => undefined),
    cleanup: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("Companion media upload job", () => {
  test("selects one source and uploads full media followed by its generated teaser", async () => {
    const deps = dependencies();
    const updates: unknown[] = [];
    const job = new MediaUploadJob(launch, deps as any, (status) => updates.push(status));
    await job.start();

    expect(deps.selectFile).toHaveBeenCalledOnce();
    expect(deps.generate).toHaveBeenCalledWith(expect.objectContaining({ sourcePath: "C:\\Podcasts\\episode.mp4" }));
    expect(deps.upload).toHaveBeenNthCalledWith(1, expect.objectContaining({ role: "video", sourcePath: "C:\\Podcasts\\episode.mp4", secret: launch.secret }));
    expect(deps.upload).toHaveBeenNthCalledWith(2, expect.objectContaining({ role: "teaser", sourcePath: "C:\\Temp\\liketac-upload\\preview.mp4", secret: launch.secret }));
    expect(job.publicStatus()).toMatchObject({ phase: "complete", fullProgress: 100, previewProgress: 100 });
    expect(JSON.stringify(updates)).not.toContain(launch.secret);
    expect(deps.cleanup).toHaveBeenCalledWith("C:\\Temp\\liketac-upload");
  });

  test("uses an audio full role for audio-only source", async () => {
    const deps = dependencies({
      probe: vi.fn(async () => ({ sourcePath: "episode.wav", kind: "audio" as const, durationSeconds: 90, hasVideo: false, hasAudio: true, formatName: "wav" })),
      generate: vi.fn(async () => ({ outputPath: "preview.m4a", kind: "audio" as const, durationSeconds: 45, encoder: "aac" as const })),
    });
    const job = new MediaUploadJob(launch, deps as any);
    await job.start();
    expect(deps.upload).toHaveBeenNthCalledWith(1, expect.objectContaining({ role: "audio" }));
  });

  test("cancels safely and removes only temporary output", async () => {
    const deps = dependencies({ generate: vi.fn(async ({ signal }: { signal: AbortSignal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))))) });
    const job = new MediaUploadJob(launch, deps as any);
    const running = job.start();
    await vi.waitFor(() => expect(deps.generate).toHaveBeenCalled());
    await job.cancel();
    await expect(running).rejects.toThrow("aborted");
    expect(job.publicStatus().phase).toBe("cancelled");
    expect(deps.cleanup).toHaveBeenCalledWith("C:\\Temp\\liketac-upload");
  });

  test("retries only the preview after the full upload already completed", async () => {
    const upload = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("preview network failure"))
      .mockResolvedValueOnce(undefined);
    const deps = dependencies({ upload });
    const job = new MediaUploadJob(launch, deps as any);
    await expect(job.start()).rejects.toThrow("preview network failure");
    await job.retry();
    expect(upload).toHaveBeenCalledTimes(3);
    expect(upload.mock.calls.map(([input]) => input.role)).toEqual(["video", "teaser", "teaser"]);
    expect(job.publicStatus().phase).toBe("complete");
  });
});
