"use client";
import { upload } from "@vercel/blob/client";
import { useState } from "react";
import type { UploadRole } from "@/features/media/upload";

export function AdminMediaUpload({ episodeId }: { episodeId: string }) {
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) { const file = formData.get("file"); const role = String(formData.get("role")) as UploadRole; if (!(file instanceof File) || !file.size) return; setMessage("Uploading…"); const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_"); try { await upload(`episodes/${episodeId}/${role}-${safeName}`, file, { access: "private", handleUploadUrl: "/api/admin/podcasts/upload", clientPayload: JSON.stringify({ episodeId, role, originalFilename: file.name }), multipart: file.size > 50_000_000 }); setMessage("Upload complete. Refresh to review the episode."); } catch { setMessage("Upload failed. Check the file type and try again."); } }
  return <form action={submit} className="stackedForm"><label>Media role<select name="role" defaultValue="video"><option value="video">Full video</option><option value="audio">Full audio</option><option value="teaser">45-second teaser</option><option value="captions">Captions</option><option value="transcript">Transcript</option></select></label><label>Choose file<input name="file" type="file" required /></label><button className="button quiet" type="submit">Upload private media</button><output aria-live="polite">{message}</output></form>;
}
