"use client";

import { upload } from "@vercel/blob/client";
import { useState, type FormEvent } from "react";
import type { UploadRole } from "@/features/media/upload";

export function AdminMediaUpload({ episodeId }: { episodeId: string }) {
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;

    const fileInput = event.currentTarget.elements.namedItem("file");
    const roleInput = event.currentTarget.elements.namedItem("role");
    const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : undefined;
    const role = roleInput instanceof HTMLSelectElement ? roleInput.value as UploadRole : "video";
    if (!file?.size) {
      setMessage("Choose a media file before uploading.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage("Preparing secure upload…");
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");

    try {
      await upload(`episodes/${episodeId}/${role}-${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/admin/podcasts/upload",
        clientPayload: JSON.stringify({ episodeId, role, originalFilename: file.name }),
        multipart: file.size > 50_000_000,
        onUploadProgress: ({ percentage }) => {
          const nextProgress = Math.max(0, Math.min(100, Math.round(percentage)));
          setProgress(nextProgress);
          setMessage(`Uploading ${nextProgress}%`);
        },
      });
      setProgress(100);
      setMessage("Upload complete. The media is ready for review.");
    } catch (error) {
      const detail = error instanceof Error && error.message
        ? ` ${error.message}`
        : " Check the file type and try again.";
      setMessage(`Upload failed.${detail}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={submit} className="stackedForm">
      <p><strong>Website-only fallback:</strong> upload full media here when Companion is unavailable. Subscriber content stays locked for visitors until Companion creates a preview.</p>
      <label>
        Media role
        <select name="role" defaultValue="video" disabled={uploading}>
          <option value="video">Full video</option>
          <option value="audio">Full audio</option>
          <option value="captions">Captions</option>
          <option value="transcript">Transcript</option>
        </select>
      </label>
      <label>
        Choose file
        <input name="file" type="file" required disabled={uploading} />
      </label>
      <button className="button quiet" type="submit" disabled={uploading}>
        {uploading ? `Uploading ${progress}%` : "Upload private media"}
      </button>
      {(uploading || progress === 100) && (
        <progress aria-label="Media upload progress" max={100} value={progress}>
          {progress}%
        </progress>
      )}
      <output aria-live="polite">{message}</output>
    </form>
  );
}
