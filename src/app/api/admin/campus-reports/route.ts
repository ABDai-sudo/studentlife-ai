import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import {
  CampusModerationError,
  getCampusReportDetail,
  listCampusReports,
  resolveCampusReport,
} from "@/services/campus-moderation.service";

const listSchema = z.object({
  status: z.enum(["OPEN", "REVIEWED", "DISMISSED", "ALL"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  id: z.string().cuid().optional(),
});

const resolveSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["OPEN", "REVIEWED", "DISMISSED"]),
  note: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  return withOwnerApi(async () => {
    const url = new URL(request.url);
    const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return fail("Invalid query", { code: "VALIDATION_ERROR", status: 422 });
    }
    try {
      if (parsed.data.id) {
        return ok(await getCampusReportDetail(parsed.data.id));
      }
      return ok(
        await listCampusReports({
          status: parsed.data.status,
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
        })
      );
    } catch (error) {
      if (error instanceof CampusModerationError) {
        return fail(error.message, {
          code: error.code,
          status: error.code === "NOT_FOUND" ? 404 : 422,
        });
      }
      throw error;
    }
  });
}

export async function POST(request: Request) {
  return withOwnerApi(async (owner) => {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const body = await request.json().catch(() => null);
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }
    try {
      const row = await resolveCampusReport({
        reportId: parsed.data.id,
        ownerId: owner.id,
        status: parsed.data.status,
        note: parsed.data.note,
        requestId: ctx.requestId,
        ipHash: ctx.ipHash,
        userAgentCat: ctx.userAgentCat,
      });
      return ok(row);
    } catch (error) {
      if (error instanceof CampusModerationError) {
        return fail(error.message, {
          code: error.code,
          status: error.code === "NOT_FOUND" ? 404 : 422,
        });
      }
      throw error;
    }
  });
}
