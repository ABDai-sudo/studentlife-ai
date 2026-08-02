import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
  action: z.string().max(100).optional(),
});

export async function GET(request: Request) {
  return withOwnerApi(async () => {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    const page = parsed.success ? parsed.data.page : 1;
    const pageSize = parsed.success ? parsed.data.pageSize : 30;
    const action = parsed.success ? parsed.data.action : undefined;

    try {
      const where = action ? { action: { contains: action } } : {};
      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            actorUserId: true,
            action: true,
            targetType: true,
            targetId: true,
            success: true,
            severity: true,
            reason: true,
            requestId: true,
            ipHash: true,
            userAgentCat: true,
            createdAt: true,
          },
        }),
      ]);
      return ok({ available: true, page, pageSize, total, logs });
    } catch {
      return ok({
        available: false,
        page: 1,
        pageSize,
        total: 0,
        logs: [],
        message: "Audit logs unavailable",
      });
    }
  });
}
