import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { CredentialStore, CredentialSecurityError, type EncryptionProvider } from "./credential-store";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function tempCredentialPath() {
  const directory = await mkdtemp(join(tmpdir(), "like-tac-companion-"));
  directories.push(directory);
  return join(directory, "obs-credential.json");
}

function encryptionProvider(available = true): EncryptionProvider {
  return {
    isEncryptionAvailable: () => available,
    encryptString: (value) => Buffer.from(`protected:${value}`, "utf8"),
    decryptString: (value) => value.toString("utf8").replace(/^protected:/, ""),
  };
}

describe("CredentialStore", () => {
  test("persists only encrypted credential material and restores it", async () => {
    const filePath = await tempCredentialPath();
    const store = new CredentialStore(filePath, encryptionProvider());

    await store.save("JavaJ@nson-is-not-the-real-secret");

    const persisted = await readFile(filePath, "utf8");
    expect(persisted).not.toContain("JavaJ@nson-is-not-the-real-secret");
    await expect(store.load()).resolves.toBe("JavaJ@nson-is-not-the-real-secret");
  });

  test("returns no credential when none has been saved", async () => {
    const store = new CredentialStore(await tempCredentialPath(), encryptionProvider());
    await expect(store.load()).resolves.toBeNull();
  });

  test("removes the persisted credential", async () => {
    const store = new CredentialStore(await tempCredentialPath(), encryptionProvider());
    await store.save("temporary-secret");
    await store.clear();
    await expect(store.load()).resolves.toBeNull();
  });

  test("fails closed when operating-system encryption is unavailable", async () => {
    const store = new CredentialStore(await tempCredentialPath(), encryptionProvider(false));

    await expect(store.save("must-not-be-written")).rejects.toBeInstanceOf(CredentialSecurityError);
    await expect(store.load()).rejects.toBeInstanceOf(CredentialSecurityError);
  });
});
