import { basename } from "node:path";

import type { GeneratedPreview, MediaProbe, MediaUploadStatus } from "../shared/contracts";
import type { UploadLaunch } from "./protocol";

type UploadRole = "video" | "audio" | "teaser";
type Dependencies = {
  selectFile(): Promise<string | null>;
  makeTempDirectory(): Promise<string>;
  probe(sourcePath: string): Promise<MediaProbe>;
  generate(input: { sourcePath: string; outputDirectory: string; signal: AbortSignal; onProgress(progress: number): void }): Promise<GeneratedPreview>;
  upload(input: { origin: string; episodeId: string; secret: string; role: UploadRole; sourcePath: string; originalFilename: string; onProgress(progress: number): void }): Promise<void>;
  cleanup(path: string): Promise<void>;
};

const initialStatus = (): MediaUploadStatus => ({ phase: "idle", preparationProgress: 0, fullProgress: 0, previewProgress: 0, sourceName: null, error: null });

export class MediaUploadJob {
  private status = initialStatus();
  private abortController: AbortController | null = null;
  private sourcePath: string | null = null;
  private fullUploaded = false;

  constructor(
    private readonly launch: UploadLaunch,
    private readonly dependencies: Dependencies,
    private readonly onStatus: (status: MediaUploadStatus) => void = () => undefined,
  ) {}

  publicStatus() { return { ...this.status }; }

  async start() {
    if (!this.sourcePath) {
      this.update({ phase: "selecting", error: null });
      this.sourcePath = await this.dependencies.selectFile();
      if (!this.sourcePath) { this.update({ phase: "cancelled" }); return; }
      this.update({ sourceName: basename(this.sourcePath) });
    }
    return this.run();
  }

  async retry() {
    if (!this.sourcePath) return this.start();
    return this.run();
  }

  async cancel() {
    this.abortController?.abort();
    this.update({ phase: "cancelled", error: null });
  }

  private async run() {
    if (!this.sourcePath) throw new Error("NO_MEDIA_SELECTED");
    const abortController = new AbortController();
    this.abortController = abortController;
    let tempDirectory: string | null = null;
    try {
      tempDirectory = await this.dependencies.makeTempDirectory();
      this.update({ phase: "preparing", preparationProgress: 0, error: null });
      const probe = await this.dependencies.probe(this.sourcePath);
      const preview = await this.dependencies.generate({
        sourcePath: this.sourcePath,
        outputDirectory: tempDirectory,
        signal: abortController.signal,
        onProgress: (preparationProgress) => this.update({ preparationProgress }),
      });
      if (!this.fullUploaded) {
        this.update({ phase: "uploading-full", preparationProgress: 100 });
        await this.dependencies.upload({
          ...this.launch,
          role: probe.kind,
          sourcePath: this.sourcePath,
          originalFilename: basename(this.sourcePath),
          onProgress: (fullProgress) => this.update({ fullProgress }),
        });
        this.fullUploaded = true;
        this.update({ fullProgress: 100 });
      }
      this.update({ phase: "uploading-preview" });
      await this.dependencies.upload({
        ...this.launch,
        role: "teaser",
        sourcePath: preview.outputPath,
        originalFilename: basename(preview.outputPath),
        onProgress: (previewProgress) => this.update({ previewProgress }),
      });
      this.update({ phase: "complete", previewProgress: 100 });
    } catch (error) {
      if (abortController.signal.aborted || this.status.phase === "cancelled") this.update({ phase: "cancelled", error: null });
      else this.update({ phase: "failed", error: error instanceof Error ? error.message : "Media preparation failed." });
      throw error;
    } finally {
      this.abortController = null;
      if (tempDirectory) await this.dependencies.cleanup(tempDirectory);
    }
  }

  private update(change: Partial<MediaUploadStatus>) {
    this.status = { ...this.status, ...change };
    this.onStatus(this.publicStatus());
  }
}
