import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import {
  createUploadedDocument,
  deleteUploadedDocument,
  listUploadedDocuments,
} from "@/services/study-tools.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { z } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await listUploadedDocuments(user.id));
  } catch {
    return serverError("Could not load files.");
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
        fileName: z.string().trim().min(1).max(200),
        mimeType: z.string().trim().min(3).max(120),
        sizeBytes: z.coerce.number().int().positive().max(5_000_000),
        kind: z
          .enum([
            "PDF",
            "IMAGE",
            "NOTES",
            "QUESTION_PAPER",
            "SYLLABUS",
            "ASSIGNMENT",
            "TEXT",
            "OTHER",
          ])
          .optional(),
        textExcerpt: z.string().max(20000).optional(),
      })
      .safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    const row = await createUploadedDocument(user.id, parsed.data);
    return ok(row);
  } catch (error) {
    const msg = String(error);
    if (msg.includes("INVALID_TYPE")) {
      return fail("Unsupported file type.", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    if (msg.includes("TOO_LARGE")) {
      return fail("File too large (max 5MB).", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    return serverError("Could not save file metadata.");
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return fail("Missing id", { code: "VALIDATION_ERROR", status: 422 });
    }
    await deleteUploadedDocument(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not delete file.");
  }
}
