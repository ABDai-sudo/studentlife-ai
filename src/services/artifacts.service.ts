import { prisma } from "@/lib/db";
import {
  buildSimplePdf,
  markdownToPdfInput,
  safeDownloadName,
  type PdfInput,
} from "@/lib/documents/pdf-generate";
import { saveUserFile, readUserFile, deleteUserFile } from "@/lib/documents/storage";

export async function createPdfArtifact(
  userId: string,
  input: {
    title: string;
    kind: string;
    markdown?: string;
    pdf?: PdfInput;
    conversationId?: string;
  }
) {
  const pdfInput =
    input.pdf ??
    markdownToPdfInput(input.title, input.markdown || " ");
  const bytes = buildSimplePdf(pdfInput);
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const fileName = safeDownloadName(input.title);
  const storageKey = await saveUserFile(userId, `art-${id}`, bytes, ".pdf");
  return prisma.generatedArtifact.create({
    data: {
      id,
      userId,
      title: input.title.slice(0, 180),
      kind: input.kind.slice(0, 40),
      fileName,
      mimeType: "application/pdf",
      storageKey,
      conversationId: input.conversationId ?? null,
    },
  });
}

export async function listArtifacts(userId: string) {
  return prisma.generatedArtifact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      title: true,
      kind: true,
      fileName: true,
      createdAt: true,
    },
  });
}

export async function getArtifactFile(userId: string, id: string) {
  const row = await prisma.generatedArtifact.findFirst({
    where: { id, userId },
  });
  if (!row) return null;
  const bytes = await readUserFile(row.storageKey);
  if (!bytes) return null;
  return { row, bytes };
}

export async function deleteArtifact(userId: string, id: string) {
  const row = await prisma.generatedArtifact.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  await deleteUserFile(row.storageKey);
  await prisma.generatedArtifact.delete({ where: { id } });
}
