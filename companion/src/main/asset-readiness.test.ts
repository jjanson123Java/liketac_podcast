import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AssetReadinessService } from "./asset-readiness";

const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

async function fixture(content = "Like TAC original asset") {
  const directory = await mkdtemp(join(tmpdir(), "like-tac-asset-"));
  directories.push(directory);
  const path = join(directory, "asset.bin");
  await writeFile(path, content);
  return path;
}

describe("AssetReadinessService", () => {
  test("accepts a readable asset only when its SHA-256 matches", async () => {
    const path = await fixture();
    const service = new AssetReadinessService();
    await expect(service.verify(path, "f910596cab890f25f0a8eb8629ec26c85b96cba6b9665a4e8641b2ae5984ba01"))
      .resolves.toEqual({ ready: true, reason: null });
    await expect(service.verify(path, "0".repeat(64))).resolves.toEqual({ ready: false, reason: "Asset checksum does not match." });
  });

  test("repairs an OBS asset path only after explicit confirmation", async () => {
    const update = vi.fn(async () => undefined);
    const service = new AssetReadinessService();
    await expect(service.repairSourcePath({ confirmed: false, sourceName: "MEDIA_Standby_Loop", assetPath: "C:\\LikeTAC\\opener.mp4", update }))
      .rejects.toThrow("Administrator confirmation is required");
    await service.repairSourcePath({ confirmed: true, sourceName: "MEDIA_Standby_Loop", assetPath: "C:\\LikeTAC\\opener.mp4", update });
    expect(update).toHaveBeenCalledWith("MEDIA_Standby_Loop", "C:\\LikeTAC\\opener.mp4");
  });
});
