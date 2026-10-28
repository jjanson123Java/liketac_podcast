import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface EncryptionProvider {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}

export class CredentialSecurityError extends Error {
  constructor() {
    super("Windows credential encryption is unavailable. The OBS password was not accessed.");
    this.name = "CredentialSecurityError";
  }
}

type PersistedCredential = { version: 1; protectedValue: string };

export class CredentialStore {
  constructor(private readonly filePath: string, private readonly encryption: EncryptionProvider) {}

  async save(password: string): Promise<void> {
    this.requireEncryption();
    const payload: PersistedCredential = {
      version: 1,
      protectedValue: this.encryption.encryptString(password).toString("base64"),
    };
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(payload), { encoding: "utf8", mode: 0o600 });
  }

  async load(): Promise<string | null> {
    this.requireEncryption();
    try {
      const payload = JSON.parse(await readFile(this.filePath, "utf8")) as PersistedCredential;
      if (payload.version !== 1 || typeof payload.protectedValue !== "string") throw new CredentialSecurityError();
      return this.encryption.decryptString(Buffer.from(payload.protectedValue, "base64"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async clear(): Promise<void> {
    await rm(this.filePath, { force: true });
  }

  private requireEncryption() {
    if (!this.encryption.isEncryptionAvailable()) throw new CredentialSecurityError();
  }
}
