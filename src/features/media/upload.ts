export type UploadRole = "audio" | "video" | "teaser" | "captions" | "transcript";
const policies: Record<UploadRole, { types: string[]; extensions: string[]; maxBytes: number }> = {
  audio: { types: ["audio/mpeg", "audio/mp4", "audio/wav"], extensions: ["mp3", "m4a", "wav"], maxBytes: 2_000_000_000 },
  video: { types: ["video/mp4", "video/webm"], extensions: ["mp4", "webm"], maxBytes: 5_000_000_000 },
  teaser: { types: ["video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/wav"], extensions: ["mp4", "webm", "mp3", "m4a", "wav"], maxBytes: 500_000_000 },
  captions: { types: ["text/vtt"], extensions: ["vtt"], maxBytes: 10_000_000 },
  transcript: { types: ["text/plain", "text/markdown", "application/pdf"], extensions: ["txt", "md", "pdf"], maxBytes: 20_000_000 },
};

export function validateUpload(file: { pathname: string; contentType: string; size: number }, role: UploadRole) {
  const errors: string[] = []; const policy = policies[role]; const path = file.pathname.replaceAll("\\", "/"); const extension = path.split(".").pop()?.toLowerCase() ?? "";
  if (path.includes("..") || path.startsWith("/") || !/^episodes\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(path)) errors.push("The object path is unsafe.");
  if (!policy.types.includes(file.contentType) || !policy.extensions.includes(extension)) errors.push("That file type is not allowed for this media role.");
  if (file.size <= 0 || file.size > policy.maxBytes) errors.push("The file is larger than the allowed limit.");
  return errors;
}

export function uploadPolicy(role: UploadRole) { return policies[role]; }
