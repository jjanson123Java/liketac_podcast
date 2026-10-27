import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { head } from "@vercel/blob";
import { and, eq, isNull } from "drizzle-orm";
import { createContentDb } from "@/db/content/client";
import { createIdentityDb } from "@/db/identity/client";
import { episodes, mediaVariants } from "@/db/content/schema";
import { requireAdmin } from "@/features/admin/authorization";
import { recordAudit } from "@/features/admin/audit";
import { uploadPolicy, validateUpload, type UploadRole } from "@/features/media/upload";

type Payload = { episodeId: string; role: UploadRole; originalFilename: string; adminUserId?: string };
export async function POST(request: Request) {
  const body = await request.json() as HandleUploadBody;
  try {
    const result = await handleUpload({ request, body, onBeforeGenerateToken: async (pathname, clientPayload) => { const admin = await requireAdmin(); const payload = { ...parsePayload(clientPayload), adminUserId: admin.userId }; const [episode] = await createContentDb().select({ id: episodes.id }).from(episodes).where(and(eq(episodes.id, payload.episodeId), isNull(episodes.deletedAt))).limit(1); if (!episode || !pathname.startsWith(`episodes/${episode.id}/${payload.role}-`)) throw new Error("Invalid upload target"); const policy = uploadPolicy(payload.role); return { allowedContentTypes: policy.types, maximumSizeInBytes: policy.maxBytes, addRandomSuffix: true, tokenPayload: JSON.stringify(payload) }; }, onUploadCompleted: async ({ blob, tokenPayload }) => { const payload = parsePayload(tokenPayload ?? null); const metadata = await head(blob.url); const errors = validateUpload({ pathname: blob.pathname, contentType: metadata.contentType, size: metadata.size }, payload.role); if (errors.length) throw new Error(errors.join(" ")); await createContentDb().insert(mediaVariants).values({ episodeId: payload.episodeId, kind: payload.role, objectKey: blob.pathname, mimeType: metadata.contentType, byteSize: metadata.size, originalFilename: payload.originalFilename }); if (payload.adminUserId) await recordAudit(createIdentityDb(), { actorUserId: payload.adminUserId, action: "admin.media.uploaded", targetType: "episode", targetId: payload.episodeId, metadata: { role: payload.role, pathname: blob.pathname } }); } }); return Response.json(result);
  } catch { return Response.json({ error: "Upload authorization failed." }, { status: 400 }); }
}
function parsePayload(value: string | null): Payload { if (!value) throw new Error("Missing upload data"); const payload = JSON.parse(value) as Payload; if (!payload.episodeId || !["audio", "video", "teaser", "captions", "transcript"].includes(payload.role)) throw new Error("Invalid upload data"); return payload; }
