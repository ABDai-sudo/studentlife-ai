import { z } from "zod";
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db";
import { recordAuditLog } from "@/services/audit.service";
import { publicDisplayName } from "@/lib/campus-circle/privacy";
import type { CampusReportStatus, Prisma } from "@prisma/client";

const STATUS_FILTER = z.enum(["OPEN", "REVIEWED", "DISMISSED", "ALL"]);

export class CampusModerationError extends Error {
  constructor(
    public code: "NOT_FOUND" | "VALIDATION" | "CONFLICT",
    message: string
  ) {
    super(message);
    this.name = "CampusModerationError";
  }
}

function safeNote(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 2000);
}

export async function listCampusReports(input: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const status = STATUS_FILTER.catch("OPEN").parse(input.status ?? "OPEN");
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 20));
  const where: Prisma.CampusReportWhereInput =
    status === "ALL" ? {} : { status };

  const [total, openCount, rows] = await withDbRetry(() =>
    Promise.all([
      prisma.campusReport.count({ where }),
      prisma.campusReport.count({ where: { status: "OPEN" } }),
      prisma.campusReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          reporter: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      }),
    ])
  );

  return {
    page,
    pageSize,
    total,
    openCount,
    reports: rows.map((row) => ({
      id: row.id,
      targetType: row.targetType,
      targetId: row.targetId,
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      reporter: {
        id: row.reporter.id,
        email: row.reporter.email,
        status: row.reporter.status,
        displayName: publicDisplayName(
          row.reporter.profile?.displayName,
          row.reporter.name ?? "Student"
        ),
      },
    })),
  };
}

export async function getCampusReportDetail(id: string) {
  const row = await withDbRetry(() =>
    prisma.campusReport.findUnique({
    where: { id },
    include: {
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          role: true,
          profile: { select: { displayName: true, avatarPresetId: true } },
        },
      },
      reviewedBy: {
        select: { id: true, email: true, name: true },
      },
    },
  })
  );
  if (!row) {
    throw new CampusModerationError("NOT_FOUND", "Report not found.");
  }

  const target = await loadSafeTarget(row.targetType, row.targetId);

  return {
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
    resolutionNote: row.resolutionNote,
    reporter: {
      id: row.reporter.id,
      email: row.reporter.email,
      status: row.reporter.status,
      role: row.reporter.role,
      displayName: publicDisplayName(
        row.reporter.profile?.displayName,
        row.reporter.name ?? "Student"
      ),
    },
    reviewedBy: row.reviewedBy
      ? {
          id: row.reviewedBy.id,
          email: row.reviewedBy.email,
          name: row.reviewedBy.name,
        }
      : null,
    target,
  };
}

type SafeTarget = {
  kind: string;
  summary: string;
  user?: {
    id: string;
    email: string;
    status: string;
    displayName: string;
  };
  group?: { id: string; name: string; memberCount: number };
  snippet?: string | null;
};

async function loadSafeTarget(
  targetType: string,
  targetId: string
): Promise<SafeTarget> {
  if (targetType === "USER") {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        profile: { select: { displayName: true } },
      },
    });
    if (!user) {
      return { kind: "USER", summary: "User no longer exists." };
    }
    return {
      kind: "USER",
      summary: "Reported student account",
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        displayName: publicDisplayName(user.profile?.displayName, user.name ?? "Student"),
      },
    };
  }

  if (targetType === "GROUP") {
    const group = await prisma.campusStudyGroup.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
    });
    if (!group) return { kind: "GROUP", summary: "Group no longer exists." };
    return {
      kind: "GROUP",
      summary: "Private study group",
      group: {
        id: group.id,
        name: group.name,
        memberCount: group._count.members,
      },
    };
  }

  if (targetType === "ACTIVITY") {
    const activity = await prisma.campusStudyGroupActivity.findUnique({
      where: { id: targetId },
      select: { id: true, body: true, kind: true, group: { select: { name: true } } },
    });
    if (!activity) {
      return { kind: "ACTIVITY", summary: "Activity no longer exists." };
    }
    return {
      kind: "ACTIVITY",
      summary: `Group activity in ${activity.group.name}`,
      snippet: activity.body.slice(0, 240),
    };
  }

  return {
    kind: targetType,
    summary: `${targetType} ${targetId.slice(0, 8)}…`,
  };
}

export async function resolveCampusReport(input: {
  reportId: string;
  ownerId: string;
  status: Extract<CampusReportStatus, "REVIEWED" | "DISMISSED" | "OPEN">;
  note?: string | null;
  requestId?: string | null;
  ipHash?: string | null;
  userAgentCat?: string | null;
}) {
  const existing = await withDbRetry(() =>
    prisma.campusReport.findUnique({
      where: { id: input.reportId },
      select: { id: true, status: true },
    })
  );
  if (!existing) {
    throw new CampusModerationError("NOT_FOUND", "Report not found.");
  }

  const nextStatus = input.status;
  const closing = nextStatus === "REVIEWED" || nextStatus === "DISMISSED";
  const row = await prisma.campusReport.update({
    where: { id: existing.id },
    data: {
      status: nextStatus,
      reviewedAt: closing ? new Date() : null,
      reviewedById: closing ? input.ownerId : null,
      resolutionNote: safeNote(input.note),
    },
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      resolutionNote: true,
    },
  });

  await recordAuditLog({
    actorUserId: input.ownerId,
    action: "admin.campus_report_resolve",
    targetType: "campus_report",
    targetId: row.id,
    success: true,
    requestId: input.requestId,
    ipHash: input.ipHash,
    userAgentCat: input.userAgentCat,
    metadata: { status: row.status },
  });

  return row;
}
