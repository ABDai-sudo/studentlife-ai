import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { createPdfArtifact, listArtifacts } from "@/services/artifacts.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { z } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await listArtifacts(user.id));
  } catch {
    return serverError("Could not load documents.");
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await request.json().catch(() => null);
    const parsed = z
      .object({
        title: z.string().trim().min(1).max(180),
        markdown: z.string().min(1).max(40000),
        kind: z.string().trim().max(40).optional(),
        conversationId: z.string().cuid().optional(),
      })
      .safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    const row = await createPdfArtifact(user.id, {
      title: parsed.data.title,
      markdown: parsed.data.markdown,
      kind: parsed.data.kind || "notes",
      conversationId: parsed.data.conversationId,
    });
    return ok({
      id: row.id,
      title: row.title,
      fileName: row.fileName,
      url: `/api/artifacts/${row.id}/file`,
    });
  } catch {
    return serverError("Could not generate PDF.");
  }
}
