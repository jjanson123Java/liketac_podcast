import { requireAdmin } from "@/features/admin/authorization";
import { episodeExists } from "@/features/media/episode-exists";
import {
  cancelUploadHandoff,
  createUploadHandoff,
  getUploadHandoffStatus,
} from "@/features/media/upload-handoff";

const genericError = { error: "Unable to prepare that upload." };

async function authenticatedAdmin() {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const admin = await authenticatedAdmin();
  if (!admin) return Response.json({ error: "Administrator authentication required." }, { status: 401 });

  try {
    const body = await request.json() as { episodeId?: unknown };
    const episodeId = typeof body.episodeId === "string" ? body.episodeId : "";
    if (!episodeId || !(await episodeExists(episodeId))) return Response.json(genericError, { status: 400 });
    const handoff = await createUploadHandoff({ episodeId, adminUserId: admin.userId });
    return Response.json(handoff, { status: 201 });
  } catch {
    return Response.json(genericError, { status: 400 });
  }
}

export async function GET(request: Request) {
  const admin = await authenticatedAdmin();
  if (!admin) return Response.json({ error: "Administrator authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json(genericError, { status: 400 });
  try {
    return Response.json(await getUploadHandoffStatus({ id, adminUserId: admin.userId }));
  } catch {
    return Response.json(genericError, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const admin = await authenticatedAdmin();
  if (!admin) return Response.json({ error: "Administrator authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json(genericError, { status: 400 });
  try {
    await cancelUploadHandoff({ id, adminUserId: admin.userId });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json(genericError, { status: 404 });
  }
}
