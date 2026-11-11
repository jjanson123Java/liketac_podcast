import { head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { createContentDb } from "@/db/content/client";
import { mediaVariants } from "@/db/content/schema";
import { createIdentityDb } from "@/db/identity/client";
import { recordAudit } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/authorization";
import { episodeExists } from "@/features/media/episode-exists";
import { claimUploadRole, completeClaimedUploadRole } from "@/features/media/upload-handoff";
import { uploadPolicy, validateUpload, type UploadRole } from "@/features/media/upload";

type ClientPayload = { episodeId: string; role: UploadRole; originalFilename: string };
type TokenPayload = ClientPayload & { adminUserId?: string; handoffId?: string };

export async function POST(request: Request) {
  const body = await request.json() as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        if (!(await episodeExists(payload.episodeId)) || !pathname.startsWith(`episodes/${payload.episodeId}/${payload.role}-`)) throw new Error("Invalid upload target");

        let tokenPayload: TokenPayload;
        let allowedContentTypes = uploadPolicy(payload.role).types;
        let validUntil: number | undefined;
        try {
          const admin = await requireAdmin();
          tokenPayload = { ...payload, adminUserId: admin.userId };
        } catch {
          if (!isCompanionRole(payload.role)) throw new Error("Invalid upload authorization");
          const secret = bearerSecret(request);
          if (!secret) throw new Error("Invalid upload authorization");
          const handoff = await claimUploadRole({ secret, episodeId: payload.episodeId, role: payload.role });
          tokenPayload = { ...payload, handoffId: handoff.id };
          validUntil = handoff.expiresAt.getTime();
          if (payload.role === "teaser") {
            allowedContentTypes = handoff.fullRole === "audio"
              ? allowedContentTypes.filter((type) => type.startsWith("audio/"))
              : allowedContentTypes.filter((type) => type.startsWith("video/"));
          }
        }

        const policy = uploadPolicy(payload.role);
        return { allowedContentTypes, maximumSizeInBytes: policy.maxBytes, validUntil, addRandomSuffix: true, tokenPayload: JSON.stringify(tokenPayload) };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parseTokenPayload(tokenPayload ?? null);
        const metadata = await head(blob.url);
        const errors = validateUpload({ pathname: blob.pathname, contentType: metadata.contentType, size: metadata.size }, payload.role);
        if (errors.length) throw new Error(errors.join(" "));

        await createContentDb().insert(mediaVariants).values({
          episodeId: payload.episodeId,
          kind: payload.role,
          objectKey: blob.pathname,
          mimeType: metadata.contentType,
          byteSize: metadata.size,
          originalFilename: payload.originalFilename,
        }).onConflictDoNothing({ target: mediaVariants.objectKey });

        if (payload.handoffId && isCompanionRole(payload.role)) await completeClaimedUploadRole({ id: payload.handoffId, episodeId: payload.episodeId, role: payload.role });
        if (payload.adminUserId) await recordAudit(createIdentityDb(), { actorUserId: payload.adminUserId, action: "admin.media.uploaded", targetType: "episode", targetId: payload.episodeId, metadata: { role: payload.role, pathname: blob.pathname } });
      },
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: "Upload authorization failed." }, { status: 400 });
  }
}

function bearerSecret(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function isCompanionRole(role: UploadRole): role is "audio" | "video" | "teaser" {
  return role === "audio" || role === "video" || role === "teaser";
}

function parseClientPayload(value: string | null): ClientPayload {
  if (!value) throw new Error("Missing upload data");
  const payload = JSON.parse(value) as Partial<ClientPayload>;
  if (typeof payload.episodeId !== "string" || typeof payload.originalFilename !== "string" || !isUploadRole(payload.role)) throw new Error("Invalid upload data");
  return payload as ClientPayload;
}

function parseTokenPayload(value: string | null): TokenPayload {
  const payload = parseClientPayload(value) as TokenPayload;
  if (!payload.adminUserId && !payload.handoffId) throw new Error("Invalid upload authorization");
  return payload;
}

function isUploadRole(role: unknown): role is UploadRole {
  return typeof role === "string" && ["audio", "video", "teaser", "captions", "transcript"].includes(role);
}
