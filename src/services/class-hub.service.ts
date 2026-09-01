import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

function classHubEnabled() {
  return process.env.FEATURE_CLASS_HUB !== "false";
}

export async function listMyHub(userId: string) {
  if (!classHubEnabled()) return { enabled: false, memberships: [] };
  const memberships = await prisma.classHubMember.findMany({
    where: { userId },
    include: {
      hub: {
        include: {
          _count: { select: { members: true, announcements: true } },
        },
      },
    },
  });
  return { enabled: true, memberships };
}

export async function joinOrCreateHub(
  userId: string,
  input: {
    institution: string;
    course: string;
    semester: string;
    inviteCode?: string;
  }
) {
  if (!classHubEnabled()) throw new Error("DISABLED");

  if (input.inviteCode) {
    const hub = await prisma.classHub.findUnique({
      where: { inviteCode: input.inviteCode.trim().toUpperCase() },
    });
    if (!hub) throw new Error("NOT_FOUND");
    await prisma.classHubMember.upsert({
      where: { hubId_userId: { hubId: hub.id, userId } },
      create: { hubId: hub.id, userId },
      update: {},
    });
    return hub;
  }

  const inviteCode = randomBytes(4).toString("hex").toUpperCase();
  const hub = await prisma.classHub.upsert({
    where: {
      institution_course_semester: {
        institution: input.institution.trim(),
        course: input.course.trim(),
        semester: input.semester.trim(),
      },
    },
    create: {
      name: `${input.course} · ${input.semester}`,
      institution: input.institution.trim(),
      course: input.course.trim(),
      semester: input.semester.trim(),
      inviteCode,
    },
    update: {},
  });

  await prisma.classHubMember.upsert({
    where: { hubId_userId: { hubId: hub.id, userId } },
    create: { hubId: hub.id, userId },
    update: {},
  });

  return hub;
}

export async function leaveHub(userId: string, hubId: string) {
  const membership = await prisma.classHubMember.findFirst({
    where: { hubId, userId },
  });
  if (!membership) throw new Error("NOT_FOUND");
  await prisma.classHubMember.delete({ where: { id: membership.id } });
}

export async function listAnnouncements(userId: string, hubId: string) {
  const membership = await prisma.classHubMember.findFirst({
    where: { hubId, userId },
  });
  if (!membership) throw new Error("FORBIDDEN");
  return prisma.classAnnouncement.findMany({
    where: { hubId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      verified: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });
}

export async function createAnnouncement(
  userId: string,
  hubId: string,
  title: string,
  body: string
) {
  const membership = await prisma.classHubMember.findFirst({
    where: { hubId, userId },
  });
  if (!membership) throw new Error("FORBIDDEN");
  return prisma.classAnnouncement.create({
    data: {
      hubId,
      authorId: userId,
      title: title.slice(0, 160),
      body: body.slice(0, 5000),
      verified: false,
    },
  });
}

export async function reportContent(
  userId: string,
  hubId: string,
  targetType: string,
  targetId: string,
  reason: string
) {
  const membership = await prisma.classHubMember.findFirst({
    where: { hubId, userId },
  });
  if (!membership) throw new Error("FORBIDDEN");
  return prisma.classHubReport.create({
    data: {
      hubId,
      reporterId: userId,
      targetType,
      targetId,
      reason: reason.slice(0, 2000),
    },
  });
}
