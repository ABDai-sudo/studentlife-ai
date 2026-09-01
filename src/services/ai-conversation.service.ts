import { prisma } from "@/lib/db";
import type { AiMessageRole } from "@prisma/client";

export async function listConversations(
  userId: string,
  search?: string,
  subject?: string
) {
  return prisma.aiConversation.findMany({
    where: {
      userId,
      archived: false,
      ...(subject ? { subject } : {}),
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      subject: true,
      pinned: true,
      updatedAt: true,
      createdAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function createConversation(
  userId: string,
  title = "New conversation",
  subject?: string
) {
  return prisma.aiConversation.create({
    data: { userId, title, subject: subject || null },
  });
}

export async function renameConversation(
  userId: string,
  id: string,
  title: string
) {
  const row = await prisma.aiConversation.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  return prisma.aiConversation.update({
    where: { id },
    data: { title },
  });
}

export async function deleteConversation(userId: string, id: string) {
  const row = await prisma.aiConversation.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  await prisma.aiConversation.delete({ where: { id } });
}

export async function getConversation(userId: string, id: string) {
  return prisma.aiConversation.findFirst({
    where: { id, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
}

export async function appendMessage(
  userId: string,
  conversationId: string,
  role: AiMessageRole,
  content: string,
  provider?: string
) {
  const convo = await prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!convo) throw new Error("NOT_FOUND");

  const message = await prisma.aiMessage.create({
    data: {
      conversationId,
      role,
      content,
      provider: provider || null,
    },
  });

  await prisma.aiConversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      ...(role === "USER" && convo.title === "New conversation"
        ? { title: content.slice(0, 60) }
        : {}),
    },
  });

  return message;
}

export async function pinConversation(
  userId: string,
  id: string,
  pinned: boolean
) {
  const row = await prisma.aiConversation.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  return prisma.aiConversation.update({
    where: { id },
    data: { pinned },
  });
}

export async function updateMessageFeedback(
  userId: string,
  messageId: string,
  feedback: number | null
) {
  const message = await prisma.aiMessage.findFirst({
    where: { id: messageId },
    include: { conversation: { select: { userId: true } } },
  });
  if (!message || message.conversation.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  return prisma.aiMessage.update({
    where: { id: messageId },
    data: { feedback },
  });
}
