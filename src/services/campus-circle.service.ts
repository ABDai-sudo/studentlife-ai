import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { features } from "@/lib/features";
import {
  publicDisplayName,
  sanitizeRecapForShare,
  visibleStudyStatus,
  type PublicStudentCard,
  type SanitizedRecapShare,
} from "@/lib/campus-circle/privacy";
import type { CampusCircleAction } from "@/lib/validations/campus-circle";
import { enqueueCampusCircleNotification } from "@/services/notification.service";
import { notifyCopy } from "@/lib/i18n/notify";
import { safeLog } from "@/lib/security/safe-log";

function dayKeyInTz(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export class CampusCircleError extends Error {
  constructor(
    public code:
      | "DISABLED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "BLOCKED"
      | "VALIDATION",
    message: string
  ) {
    super(message);
    this.name = "CampusCircleError";
  }
}

function assertEnabled() {
  if (!features.campusCircle) {
    throw new CampusCircleError("DISABLED", "Campus Circle is not enabled.");
  }
}

function genericConnectFail(): never {
  throw new CampusCircleError(
    "NOT_FOUND",
    "Could not send that request."
  );
}

async function notifyCampusEvent(
  recipientId: string,
  fromUserId: string,
  kind: "connection" | "study_invite" | "quiz_challenge",
  idempotencyKey: string
) {
  try {
    const [from, recipient] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: fromUserId },
        select: { displayName: true },
      }),
      prisma.studentProfile.findUnique({
        where: { userId: recipientId },
        select: { preferredUiLanguage: true },
      }),
    ]);
    const name = publicDisplayName(from?.displayName);
    const lang = recipient?.preferredUiLanguage;
    const copy =
      kind === "connection"
        ? {
            title: "notif.campusConnectionTitle" as const,
            body: "notif.campusConnectionBody" as const,
          }
        : kind === "study_invite"
          ? {
              title: "notif.campusStudyInviteTitle" as const,
              body: "notif.campusStudyInviteBody" as const,
            }
          : {
              title: "notif.campusQuizChallengeTitle" as const,
              body: "notif.campusQuizChallengeBody" as const,
            };
    await enqueueCampusCircleNotification({
      userId: recipientId,
      title: notifyCopy(copy.title, lang, { name }),
      body: notifyCopy(copy.body, lang, { name }),
      href: "/dashboard/campus-circle",
      idempotencyKey,
      metadata: { kind },
    });
  } catch (error) {
    safeLog("warn", "Campus Circle notification skipped", {
      kind,
      error: String(error),
    });
  }
}

async function getOrCreateSettings(userId: string) {
  return prisma.campusCircleSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function isBlockedPair(a: string, b: string): Promise<boolean> {
  const row = await prisma.campusBlock.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { id: true },
  });
  return Boolean(row);
}

async function findConnection(a: string, b: string) {
  return prisma.campusConnection.findFirst({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

async function requireAcceptedConnection(a: string, b: string) {
  if (a === b) {
    throw new CampusCircleError("VALIDATION", "That action is not allowed.");
  }
  if (await isBlockedPair(a, b)) {
    throw new CampusCircleError("BLOCKED", "This student is not available.");
  }
  const row = await findConnection(a, b);
  if (!row || row.status !== "ACCEPTED") {
    throw new CampusCircleError("FORBIDDEN", "Only existing connections can do that.");
  }
  return row;
}

async function cardsFor(userIds: string[]): Promise<Map<string, PublicStudentCard>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, PublicStudentCard>();
  if (unique.length === 0) return map;

  const [profiles, settings] = await Promise.all([
    prisma.studentProfile.findMany({
      where: { userId: { in: unique } },
      select: { userId: true, displayName: true, avatarPresetId: true },
    }),
    prisma.campusCircleSettings.findMany({
      where: { userId: { in: unique } },
      select: { userId: true, studyStatus: true, shareStudyStatus: true },
    }),
  ]);

  const profileBy = new Map(profiles.map((p) => [p.userId, p]));
  const settingsBy = new Map(settings.map((s) => [s.userId, s]));

  for (const id of unique) {
    const profile = profileBy.get(id);
    const setting = settingsBy.get(id);
    map.set(id, {
      id,
      displayName: publicDisplayName(profile?.displayName),
      avatarPresetId: profile?.avatarPresetId ?? null,
      studyStatus: setting
        ? visibleStudyStatus({
            shareStudyStatus: setting.shareStudyStatus,
            studyStatus: setting.studyStatus,
          })
        : null,
    });
  }
  return map;
}

async function computeShareablePreview(userId: string): Promise<SanitizedRecapShare> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  const weekStart = weekStartFor(profile?.timezone || "Asia/Kolkata");
  const existing = await prisma.weeklyRecap.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (existing) {
    return sanitizeRecapForShare(
      (existing.payload ?? {}) as Record<string, unknown>
    );
  }
  const since = weekStart;
  const [tasksDone, sessions, quizzes, streak] = await Promise.all([
    prisma.assignment.count({
      where: {
        userId,
        status: { in: ["SUBMITTED", "GRADED"] },
        updatedAt: { gte: since },
      },
    }),
    prisma.studySession.findMany({
      where: { userId, completed: true, startedAt: { gte: since } },
      select: { actualMinutes: true },
    }),
    prisma.quizAttempt.count({
      where: { userId, createdAt: { gte: since } },
    }),
    prisma.streak.findUnique({
      where: { userId_type: { userId, type: "study" } },
      select: { currentCount: true },
    }),
  ]);
  return sanitizeRecapForShare({
    studyMinutes: sessions.reduce((s, x) => s + (x.actualMinutes ?? 0), 0),
    tasksCompleted: tasksDone,
    quizzesCompleted: quizzes,
    currentStreak: streak?.currentCount ?? 0,
  });
}

async function cutTiesBetween(a: string, b: string) {
  await prisma.$transaction([
    prisma.campusConnection.deleteMany({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    }),
    prisma.campusStudyInvite.deleteMany({
      where: {
        OR: [
          { fromUserId: a, toUserId: b },
          { fromUserId: b, toUserId: a },
        ],
      },
    }),
    prisma.campusQuizChallenge.deleteMany({
      where: {
        OR: [
          { fromUserId: a, toUserId: b },
          { fromUserId: b, toUserId: a },
        ],
      },
    }),
    prisma.campusStudyGroupInvite.deleteMany({
      where: {
        status: "PENDING",
        OR: [
          { invitedUserId: a, invitedById: b },
          { invitedUserId: b, invitedById: a },
        ],
      },
    }),
    prisma.campusRecapShare.deleteMany({
      where: {
        OR: [
          { fromUserId: a, toUserId: b },
          { fromUserId: b, toUserId: a },
        ],
      },
    }),
  ]);
}

function weekStartFor(timezone: string): Date {
  const today = new Date(dayKeyInTz(timezone || "Asia/Kolkata"));
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return weekStart;
}

async function getOrCreateShareableRecap(userId: string): Promise<{
  recapId: string;
  payload: SanitizedRecapShare;
}> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  const weekStart = weekStartFor(profile?.timezone || "Asia/Kolkata");
  const since = weekStart;

  const [tasksDone, sessions, quizzes, streak, existing] = await Promise.all([
    prisma.assignment.count({
      where: {
        userId,
        status: { in: ["SUBMITTED", "GRADED"] },
        updatedAt: { gte: since },
      },
    }),
    prisma.studySession.findMany({
      where: { userId, completed: true, startedAt: { gte: since } },
      select: { actualMinutes: true },
    }),
    prisma.quizAttempt.count({
      where: { userId, createdAt: { gte: since } },
    }),
    prisma.streak.findUnique({
      where: { userId_type: { userId, type: "study" } },
      select: { currentCount: true },
    }),
    prisma.weeklyRecap.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    }),
  ]);

  const computed = sanitizeRecapForShare({
    studyMinutes: sessions.reduce((s, x) => s + (x.actualMinutes ?? 0), 0),
    tasksCompleted: tasksDone,
    quizzesCompleted: quizzes,
    currentStreak: streak?.currentCount ?? 0,
  });

  if (existing) {
    return {
      recapId: existing.id,
      payload: sanitizeRecapForShare(
        (existing.payload ?? {}) as Record<string, unknown>
      ),
    };
  }

  const recap = await prisma.weeklyRecap.create({
    data: {
      userId,
      weekStart,
      payload: computed,
      hideIdentity: true,
    },
  });
  return { recapId: recap.id, payload: computed };
}

function reactionSummary(
  rows: { targetId: string; kind: string; userId: string }[],
  viewerId: string
) {
  const byTarget = new Map<
    string,
    { ENCOURAGE: number; THANKS: number; FOCUS: number; mine: string[] }
  >();
  for (const row of rows) {
    const cur = byTarget.get(row.targetId) ?? {
      ENCOURAGE: 0,
      THANKS: 0,
      FOCUS: 0,
      mine: [],
    };
    if (row.kind === "ENCOURAGE" || row.kind === "THANKS" || row.kind === "FOCUS") {
      cur[row.kind] += 1;
    }
    if (row.userId === viewerId) cur.mine.push(row.kind);
    byTarget.set(row.targetId, cur);
  }
  return byTarget;
}

export async function getCampusCircleOverview(userId: string) {
  if (!features.campusCircle) {
    return { enabled: false as const };
  }

  const [
    settings,
    connections,
    blocks,
    incomingInvites,
    outgoingInvites,
    incomingChallenges,
    outgoingChallenges,
    incomingShares,
    outgoingShares,
    memberships,
    groupInvites,
    reportsCount,
  ] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.campusConnection.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.campusBlock.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campusStudyInvite.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.campusStudyInvite.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.campusQuizChallenge.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.campusQuizChallenge.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.campusRecapShare.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.campusRecapShare.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.campusStudyGroupMember.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            _count: { select: { members: true, activities: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.campusStudyGroupInvite.findMany({
      where: { invitedUserId: userId, status: "PENDING" },
      include: {
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campusReport.count({ where: { reporterId: userId } }),
  ]);

  const otherIds = [
    ...connections.map((c) =>
      c.requesterId === userId ? c.addresseeId : c.requesterId
    ),
    ...blocks.map((b) => b.blockedId),
    ...incomingInvites.map((i) => i.fromUserId),
    ...outgoingInvites.map((i) => i.toUserId),
    ...incomingChallenges.map((i) => i.fromUserId),
    ...outgoingChallenges.map((i) => i.toUserId),
    ...incomingShares.map((s) => s.fromUserId),
    ...outgoingShares.map((s) => s.toUserId),
    ...groupInvites.map((g) => g.invitedById),
  ];
  const cards = await cardsFor([...otherIds, userId]);
  const me = cards.get(userId)!;

  const accepted = connections.filter((c) => c.status === "ACCEPTED");
  const incoming = connections.filter(
    (c) => c.status === "PENDING" && c.addresseeId === userId
  );
  const outgoing = connections.filter(
    (c) => c.status === "PENDING" && c.requesterId === userId
  );

  const shareIds = [...incomingShares, ...outgoingShares].map((s) => s.id);
  const reactions = shareIds.length
    ? await prisma.campusReaction.findMany({
        where: { targetType: "SHARE", targetId: { in: shareIds } },
        select: { targetId: true, kind: true, userId: true },
      })
    : [];
  const reactionMap = reactionSummary(reactions, userId);

  const recapPreview = await computeShareablePreview(userId).catch(() => null);

  return {
    enabled: true as const,
    me,
    settings: {
      studyStatus: settings.studyStatus,
      shareStudyStatus: settings.shareStudyStatus,
      allowConnectionRequests: settings.allowConnectionRequests,
      allowStudyInvites: settings.allowStudyInvites,
      allowQuizChallenges: settings.allowQuizChallenges,
      allowGroupInvites: settings.allowGroupInvites,
    },
    connections: accepted.map((c) => {
      const otherId = c.requesterId === userId ? c.addresseeId : c.requesterId;
      return { id: c.id, user: cards.get(otherId)! };
    }),
    incomingRequests: incoming.map((c) => ({
      id: c.id,
      user: cards.get(c.requesterId)!,
    })),
    outgoingRequests: outgoing.map((c) => ({
      id: c.id,
      user: cards.get(c.addresseeId)!,
    })),
    studyInvites: {
      incoming: incomingInvites.map((i) => ({
        id: i.id,
        status: i.status,
        topic: i.topic,
        user: cards.get(i.fromUserId)!,
      })),
      outgoing: outgoingInvites.map((i) => ({
        id: i.id,
        status: i.status,
        topic: i.topic,
        user: cards.get(i.toUserId)!,
      })),
    },
    quizChallenges: {
      incoming: incomingChallenges.map((i) => ({
        id: i.id,
        status: i.status,
        user: cards.get(i.fromUserId)!,
      })),
      outgoing: outgoingChallenges.map((i) => ({
        id: i.id,
        status: i.status,
        user: cards.get(i.toUserId)!,
      })),
    },
    recapShares: {
      preview: recapPreview,
      incoming: incomingShares.map((s) => ({
        id: s.id,
        payload: sanitizeRecapForShare(s.payload as Record<string, unknown>),
        user: cards.get(s.fromUserId)!,
        reactions: reactionMap.get(s.id) ?? {
          ENCOURAGE: 0,
          THANKS: 0,
          FOCUS: 0,
          mine: [],
        },
      })),
      outgoing: outgoingShares.map((s) => ({
        id: s.id,
        payload: sanitizeRecapForShare(s.payload as Record<string, unknown>),
        user: cards.get(s.toUserId)!,
        reactions: reactionMap.get(s.id) ?? {
          ENCOURAGE: 0,
          THANKS: 0,
          FOCUS: 0,
          mine: [],
        },
      })),
    },
    groups: memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      role: m.role,
      memberCount: m.group._count.members,
      activityCount: m.group._count.activities,
      isOwner: m.group.ownerId === userId,
    })),
    groupInvites: groupInvites.map((g) => ({
      id: g.id,
      groupId: g.group.id,
      groupName: g.group.name,
      from: cards.get(g.invitedById)!,
    })),
    blocked: blocks.map((b) => ({
      id: b.blockedId,
      user: cards.get(b.blockedId)!,
    })),
    reportsFiled: reportsCount,
  };
}

export async function getCampusGroupDetail(userId: string, groupId: string) {
  assertEnabled();
  const membership = await prisma.campusStudyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new CampusCircleError("FORBIDDEN", "You are not a member of this group.");
  }

  const group = await prisma.campusStudyGroup.findUnique({
    where: { id: groupId },
    include: {
      members: { select: { userId: true, role: true, joinedAt: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { id: true, authorId: true, kind: true, body: true, createdAt: true },
      },
    },
  });
  if (!group) throw new CampusCircleError("NOT_FOUND", "Group not found.");

  const cards = await cardsFor([
    ...group.members.map((m) => m.userId),
    ...group.activities.map((a) => a.authorId),
  ]);
  const activityIds = group.activities.map((a) => a.id);
  const reactions = activityIds.length
    ? await prisma.campusReaction.findMany({
        where: { targetType: "ACTIVITY", targetId: { in: activityIds } },
        select: { targetId: true, kind: true, userId: true },
      })
    : [];
  const reactionMap = reactionSummary(reactions, userId);

  return {
    id: group.id,
    name: group.name,
    role: membership.role,
    isOwner: group.ownerId === userId,
    members: group.members.map((m) => ({
      role: m.role,
      joinedAt: m.joinedAt,
      user: cards.get(m.userId)!,
    })),
    activities: group.activities.map((a) => ({
      id: a.id,
      kind: a.kind,
      body: a.body,
      createdAt: a.createdAt,
      author: cards.get(a.authorId)!,
      reactions: reactionMap.get(a.id) ?? {
        ENCOURAGE: 0,
        THANKS: 0,
        FOCUS: 0,
        mine: [],
      },
    })),
  };
}

async function updatePrivacy(userId: string, input: Extract<CampusCircleAction, { action: "update_privacy" }>) {
  const data: Prisma.CampusCircleSettingsUpdateInput = {};
  if (input.studyStatus !== undefined) data.studyStatus = input.studyStatus;
  if (input.shareStudyStatus !== undefined)
    data.shareStudyStatus = input.shareStudyStatus;
  if (input.allowConnectionRequests !== undefined)
    data.allowConnectionRequests = input.allowConnectionRequests;
  if (input.allowStudyInvites !== undefined)
    data.allowStudyInvites = input.allowStudyInvites;
  if (input.allowQuizChallenges !== undefined)
    data.allowQuizChallenges = input.allowQuizChallenges;
  if (input.allowGroupInvites !== undefined)
    data.allowGroupInvites = input.allowGroupInvites;

  await getOrCreateSettings(userId);
  return prisma.campusCircleSettings.update({
    where: { userId },
    data,
  });
}

async function sendConnection(userId: string, rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const target = await prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true },
  });
  if (!target || target.id === userId || target.status !== "ACTIVE") {
    genericConnectFail();
  }
  if (await isBlockedPair(userId, target.id)) {
    genericConnectFail();
  }

  const theirSettings = await getOrCreateSettings(target.id);
  if (!theirSettings.allowConnectionRequests) genericConnectFail();

  const existing = await findConnection(userId, target.id);
  if (existing?.status === "ACCEPTED") {
    throw new CampusCircleError("CONFLICT", "You are already connected.");
  }
  if (existing?.status === "PENDING") {
    if (existing.addresseeId === userId) {
      throw new CampusCircleError(
        "CONFLICT",
        "This student already sent you a request."
      );
    }
    throw new CampusCircleError("CONFLICT", "A request is already pending.");
  }

  if (existing?.status === "DECLINED") {
    if (existing.requesterId === userId) {
      const row = await prisma.campusConnection.update({
        where: { id: existing.id },
        data: { status: "PENDING", respondedAt: null },
      });
      await notifyCampusEvent(
        target.id,
        userId,
        "connection",
        `campus:connect:${row.id}:${row.updatedAt.getTime()}`
      );
      return row;
    }
    const row = await prisma.campusConnection.update({
      where: { id: existing.id },
      data: {
        requesterId: userId,
        addresseeId: target.id,
        status: "PENDING",
        respondedAt: null,
      },
    });
    await notifyCampusEvent(
      target.id,
      userId,
      "connection",
      `campus:connect:${row.id}:${row.updatedAt.getTime()}`
    );
    return row;
  }

  try {
    const row = await prisma.campusConnection.create({
      data: { requesterId: userId, addresseeId: target.id },
    });
    await notifyCampusEvent(
      target.id,
      userId,
      "connection",
      `campus:connect:${row.id}:${row.updatedAt.getTime()}`
    );
    return row;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CampusCircleError("CONFLICT", "A request is already pending.");
    }
    throw error;
  }
}

async function respondConnection(
  userId: string,
  connectionId: string,
  accept: boolean
) {
  const row = await prisma.campusConnection.findUnique({
    where: { id: connectionId },
  });
  if (!row || row.addresseeId !== userId) {
    throw new CampusCircleError("NOT_FOUND", "Request not found.");
  }
  if (row.status !== "PENDING") {
    throw new CampusCircleError("CONFLICT", "This request was already handled.");
  }
  if (await isBlockedPair(userId, row.requesterId)) {
    throw new CampusCircleError("BLOCKED", "This student is not available.");
  }
  return prisma.campusConnection.update({
    where: { id: row.id },
    data: {
      status: accept ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });
}

async function removeConnection(userId: string, otherId: string) {
  if (userId === otherId) {
    throw new CampusCircleError("VALIDATION", "That action is not allowed.");
  }
  const row = await findConnection(userId, otherId);
  if (!row || row.status !== "ACCEPTED") {
    throw new CampusCircleError("NOT_FOUND", "Connection not found.");
  }
  if (row.requesterId !== userId && row.addresseeId !== userId) {
    throw new CampusCircleError("FORBIDDEN", "Access denied.");
  }
  await cutTiesBetween(userId, otherId);
  return { removed: true };
}

async function blockUser(userId: string, otherId: string) {
  if (userId === otherId) {
    throw new CampusCircleError("VALIDATION", "You cannot block yourself.");
  }
  const exists = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true },
  });
  if (!exists) throw new CampusCircleError("NOT_FOUND", "Student not found.");

  await cutTiesBetween(userId, otherId);
  await prisma.campusBlock.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: otherId } },
    create: { blockerId: userId, blockedId: otherId },
    update: {},
  });
  return { blocked: true };
}

async function unblockUser(userId: string, otherId: string) {
  const row = await prisma.campusBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: otherId } },
  });
  if (!row) throw new CampusCircleError("NOT_FOUND", "Block not found.");
  await prisma.campusBlock.delete({ where: { id: row.id } });
  return { unblocked: true };
}

async function reportContent(
  userId: string,
  input: Extract<CampusCircleAction, { action: "report" }>
) {
  if (input.targetType === "USER" && input.targetId === userId) {
    throw new CampusCircleError("VALIDATION", "You cannot report yourself.");
  }
  try {
    return await prisma.campusReport.create({
      data: {
        reporterId: userId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details?.slice(0, 2000) ?? null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.campusReport.findUnique({
        where: {
          reporterId_targetType_targetId: {
            reporterId: userId,
            targetType: input.targetType,
            targetId: input.targetId,
          },
        },
      });
      if (existing) return existing;
      throw new CampusCircleError("CONFLICT", "You already reported this.");
    }
    throw error;
  }
}

async function sendStudyInvite(userId: string, otherId: string, topic?: string) {
  await requireAcceptedConnection(userId, otherId);
  const theirSettings = await getOrCreateSettings(otherId);
  if (!theirSettings.allowStudyInvites) {
    throw new CampusCircleError("FORBIDDEN", "This student is not taking study invites.");
  }
  const existing = await prisma.campusStudyInvite.findUnique({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherId } },
  });
  if (existing?.status === "PENDING") {
    throw new CampusCircleError("CONFLICT", "A study invite is already pending.");
  }
  const data = {
    status: "PENDING" as const,
    topic: topic?.trim().slice(0, 80) || null,
    respondedAt: null,
  };
  if (existing) {
    const row = await prisma.campusStudyInvite.update({
      where: { id: existing.id },
      data,
    });
    await notifyCampusEvent(
      otherId,
      userId,
      "study_invite",
      `campus:study:${row.id}:${row.updatedAt.getTime()}`
    );
    return row;
  }
  const row = await prisma.campusStudyInvite.create({
    data: { fromUserId: userId, toUserId: otherId, ...data },
  });
  await notifyCampusEvent(
    otherId,
    userId,
    "study_invite",
    `campus:study:${row.id}:${row.updatedAt.getTime()}`
  );
  return row;
}

async function respondStudyInvite(
  userId: string,
  inviteId: string,
  accept: boolean
) {
  const row = await prisma.campusStudyInvite.findUnique({
    where: { id: inviteId },
  });
  if (!row || row.toUserId !== userId) {
    throw new CampusCircleError("NOT_FOUND", "Invite not found.");
  }
  if (row.status !== "PENDING") {
    throw new CampusCircleError("CONFLICT", "This invite was already handled.");
  }
  await requireAcceptedConnection(userId, row.fromUserId);
  return prisma.campusStudyInvite.update({
    where: { id: row.id },
    data: {
      status: accept ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });
}

async function sendQuizChallenge(userId: string, otherId: string) {
  await requireAcceptedConnection(userId, otherId);
  const theirSettings = await getOrCreateSettings(otherId);
  if (!theirSettings.allowQuizChallenges) {
    throw new CampusCircleError(
      "FORBIDDEN",
      "This student is not taking Quiz Rush challenges."
    );
  }
  const existing = await prisma.campusQuizChallenge.findUnique({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherId } },
  });
  if (existing?.status === "PENDING") {
    throw new CampusCircleError("CONFLICT", "A Quiz Rush challenge is already pending.");
  }
  const data = { status: "PENDING" as const, respondedAt: null };
  if (existing) {
    const row = await prisma.campusQuizChallenge.update({
      where: { id: existing.id },
      data,
    });
    await notifyCampusEvent(
      otherId,
      userId,
      "quiz_challenge",
      `campus:quiz:${row.id}:${row.updatedAt.getTime()}`
    );
    return row;
  }
  const row = await prisma.campusQuizChallenge.create({
    data: { fromUserId: userId, toUserId: otherId, ...data },
  });
  await notifyCampusEvent(
    otherId,
    userId,
    "quiz_challenge",
    `campus:quiz:${row.id}:${row.updatedAt.getTime()}`
  );
  return row;
}

async function respondQuizChallenge(
  userId: string,
  challengeId: string,
  accept: boolean
) {
  const row = await prisma.campusQuizChallenge.findUnique({
    where: { id: challengeId },
  });
  if (!row || row.toUserId !== userId) {
    throw new CampusCircleError("NOT_FOUND", "Challenge not found.");
  }
  if (row.status !== "PENDING") {
    throw new CampusCircleError("CONFLICT", "This challenge was already handled.");
  }
  await requireAcceptedConnection(userId, row.fromUserId);
  return prisma.campusQuizChallenge.update({
    where: { id: row.id },
    data: {
      status: accept ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });
}

async function shareRecap(userId: string, otherId: string) {
  await requireAcceptedConnection(userId, otherId);
  const snapshot = await getOrCreateShareableRecap(userId);
  try {
    return await prisma.campusRecapShare.create({
      data: {
        recapId: snapshot.recapId,
        fromUserId: userId,
        toUserId: otherId,
        payload: snapshot.payload,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CampusCircleError(
        "CONFLICT",
        "You already shared this week's recap with this connection."
      );
    }
    throw error;
  }
}

async function createGroup(userId: string, name: string) {
  const inviteCode = randomBytes(4).toString("hex").toUpperCase();
  const group = await prisma.campusStudyGroup.create({
    data: {
      name: name.trim().slice(0, 80),
      ownerId: userId,
      inviteCode,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });
  return { id: group.id, name: group.name };
}

async function inviteToGroup(userId: string, groupId: string, otherId: string) {
  const membership = await prisma.campusStudyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new CampusCircleError("FORBIDDEN", "You are not a member of this group.");
  }
  await requireAcceptedConnection(userId, otherId);
  const theirSettings = await getOrCreateSettings(otherId);
  if (!theirSettings.allowGroupInvites) {
    throw new CampusCircleError("FORBIDDEN", "This student is not taking group invites.");
  }
  const already = await prisma.campusStudyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: otherId } },
  });
  if (already) {
    throw new CampusCircleError("CONFLICT", "This student is already in the group.");
  }
  const existing = await prisma.campusStudyGroupInvite.findUnique({
    where: { groupId_invitedUserId: { groupId, invitedUserId: otherId } },
  });
  if (existing?.status === "PENDING") {
    throw new CampusCircleError("CONFLICT", "A group invite is already pending.");
  }
  if (existing) {
    return prisma.campusStudyGroupInvite.update({
      where: { id: existing.id },
      data: {
        invitedById: userId,
        status: "PENDING",
        respondedAt: null,
      },
    });
  }
  return prisma.campusStudyGroupInvite.create({
    data: {
      groupId,
      invitedUserId: otherId,
      invitedById: userId,
    },
  });
}

async function respondGroupInvite(
  userId: string,
  inviteId: string,
  accept: boolean
) {
  const row = await prisma.campusStudyGroupInvite.findUnique({
    where: { id: inviteId },
  });
  if (!row || row.invitedUserId !== userId) {
    throw new CampusCircleError("NOT_FOUND", "Invite not found.");
  }
  if (row.status !== "PENDING") {
    throw new CampusCircleError("CONFLICT", "This invite was already handled.");
  }
  if (!accept) {
    return prisma.campusStudyGroupInvite.update({
      where: { id: row.id },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  }
  if (await isBlockedPair(userId, row.invitedById)) {
    throw new CampusCircleError("BLOCKED", "This student is not available.");
  }
  await prisma.$transaction([
    prisma.campusStudyGroupMember.upsert({
      where: { groupId_userId: { groupId: row.groupId, userId } },
      create: { groupId: row.groupId, userId, role: "MEMBER" },
      update: {},
    }),
    prisma.campusStudyGroupInvite.update({
      where: { id: row.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    }),
  ]);
  return { joined: true, groupId: row.groupId };
}

async function leaveGroup(userId: string, groupId: string) {
  const membership = await prisma.campusStudyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw new CampusCircleError("NOT_FOUND", "You are not in this group.");

  const group = await prisma.campusStudyGroup.findUnique({
    where: { id: groupId },
    include: { members: { orderBy: { joinedAt: "asc" } } },
  });
  if (!group) throw new CampusCircleError("NOT_FOUND", "Group not found.");

  if (group.ownerId === userId) {
    const nextOwner = group.members.find((m) => m.userId !== userId);
    if (!nextOwner) {
      await prisma.campusStudyGroup.delete({ where: { id: groupId } });
      return { left: true, dissolved: true };
    }
    await prisma.$transaction([
      prisma.campusStudyGroup.update({
        where: { id: groupId },
        data: { ownerId: nextOwner.userId },
      }),
      prisma.campusStudyGroupMember.update({
        where: { id: nextOwner.id },
        data: { role: "OWNER" },
      }),
      prisma.campusStudyGroupMember.delete({ where: { id: membership.id } }),
    ]);
    return { left: true, dissolved: false };
  }

  await prisma.campusStudyGroupMember.delete({ where: { id: membership.id } });
  return { left: true, dissolved: false };
}

async function postActivity(
  userId: string,
  groupId: string,
  body: string,
  kind: "CHECK_IN" | "PLAN" | "NOTE" = "CHECK_IN"
) {
  const membership = await prisma.campusStudyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new CampusCircleError("FORBIDDEN", "You are not a member of this group.");
  }
  return prisma.campusStudyGroupActivity.create({
    data: {
      groupId,
      authorId: userId,
      kind,
      body: body.trim().slice(0, 500),
    },
  });
}

async function addReaction(
  userId: string,
  targetType: "SHARE" | "ACTIVITY",
  targetId: string,
  kind: "ENCOURAGE" | "THANKS" | "FOCUS"
) {
  if (targetType === "SHARE") {
    const share = await prisma.campusRecapShare.findUnique({
      where: { id: targetId },
    });
    if (!share || (share.fromUserId !== userId && share.toUserId !== userId)) {
      throw new CampusCircleError("FORBIDDEN", "You cannot react to that.");
    }
  } else {
    const activity = await prisma.campusStudyGroupActivity.findUnique({
      where: { id: targetId },
      select: { groupId: true },
    });
    if (!activity) throw new CampusCircleError("NOT_FOUND", "Activity not found.");
    const membership = await prisma.campusStudyGroupMember.findUnique({
      where: { groupId_userId: { groupId: activity.groupId, userId } },
    });
    if (!membership) {
      throw new CampusCircleError("FORBIDDEN", "You are not a member of this group.");
    }
  }

  try {
    return await prisma.campusReaction.create({
      data: { userId, targetType, targetId, kind },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.campusReaction.findUnique({
        where: {
          userId_targetType_targetId_kind: {
            userId,
            targetType,
            targetId,
            kind,
          },
        },
      });
      if (existing) return existing;
      throw new CampusCircleError("CONFLICT", "Already reacted.");
    }
    throw error;
  }
}

export async function runCampusCircleAction(
  userId: string,
  input: CampusCircleAction
) {
  assertEnabled();
  switch (input.action) {
    case "update_privacy":
      return updatePrivacy(userId, input);
    case "connect":
      return sendConnection(userId, input.email);
    case "respond_connection":
      return respondConnection(userId, input.connectionId, input.accept);
    case "remove_connection":
      return removeConnection(userId, input.userId);
    case "block":
      return blockUser(userId, input.userId);
    case "unblock":
      return unblockUser(userId, input.userId);
    case "report":
      return reportContent(userId, input);
    case "study_invite":
      return sendStudyInvite(userId, input.userId, input.topic);
    case "respond_study_invite":
      return respondStudyInvite(userId, input.inviteId, input.accept);
    case "quiz_challenge":
      return sendQuizChallenge(userId, input.userId);
    case "respond_quiz_challenge":
      return respondQuizChallenge(userId, input.challengeId, input.accept);
    case "share_recap":
      return shareRecap(userId, input.userId);
    case "create_group":
      return createGroup(userId, input.name);
    case "invite_to_group":
      return inviteToGroup(userId, input.groupId, input.userId);
    case "respond_group_invite":
      return respondGroupInvite(userId, input.inviteId, input.accept);
    case "leave_group":
      return leaveGroup(userId, input.groupId);
    case "post_activity":
      return postActivity(userId, input.groupId, input.body, input.kind);
    case "react":
      return addReaction(userId, input.targetType, input.targetId, input.kind);
    default:
      throw new CampusCircleError("VALIDATION", "Unknown action.");
  }
}
