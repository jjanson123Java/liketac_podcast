import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export class AssetReadinessService {
  async verify(path: string, expectedSha256: string) {
    try {
      const actual = createHash("sha256").update(await readFile(path)).digest("hex");
      return actual === expectedSha256
        ? { ready: true, reason: null }
        : { ready: false, reason: "Asset checksum does not match." };
    } catch {
      return { ready: false, reason: "Asset is missing or unreadable." };
    }
  }

  async repairSourcePath(input: {
    confirmed: boolean;
    sourceName: string;
    assetPath: string;
    update: (sourceName: string, assetPath: string) => Promise<void>;
  }) {
    if (!input.confirmed) throw new Error("Administrator confirmation is required before repairing an OBS source path.");
    await input.update(input.sourceName, input.assetPath);
  }
}
