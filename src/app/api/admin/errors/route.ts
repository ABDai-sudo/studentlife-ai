import { ok } from "@/lib/api";
import { withOwnerApi } from "@/lib/admin/api";
import { prisma } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  resolved: z.enum(["true", "false", "all"]).optional(),
});

export async function GET(request: Request) {
  return withOwnerApi(async () => {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return ok({ page: 1, total: 0, errors: [], available: false });
    }
    const { page, pageSize, resolved } = parsed.data;
    const where =
      resolved === "true"
        ? { resolved: true }
        : resolved === "false"
          ? { resolved: false }
          : {};

    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [total, errors, failingRoutes, countWeek] = await Promise.all([
        prisma.appErrorLog.count({ where }),
        prisma.appErrorLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            route: true,
            method: true,
            statusCode: true,
            errorCode: true,
            category: true,
            messageSafe: true,
            durationMs: true,
            resolved: true,
            createdAt: true,
          },
        }),
        prisma.appErrorLog.groupBy({
          by: ["route"],
          where: { createdAt: { gte: since } },
          _count: { _all: true },
          orderBy: { _count: { route: "desc" } },
          take: 10,
        }),
        prisma.appErrorLog.count({ where: { createdAt: { gte: since } } }),
      ]);

      return ok({
        available: true,
        page,
        pageSize,
        total,
        countWeek,
        failingRoutes: failingRoutes.map((r) => ({
          route: r.route,
          count: r._count._all,
        })),
        errors,
      });
    } catch {
      return ok({
        available: false,
        page: 1,
        pageSize,
        total: 0,
        countWeek: 0,
        failingRoutes: [],
        errors: [],
        message: "Error logs unavailable",
      });
    }
  });
}
