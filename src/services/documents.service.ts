import { prisma } from "@/lib/db";
import { extractPdfText } from "@/lib/documents/pdf-text";
import { extractDocxText } from "@/lib/documents/docx-text";
import { retrieveChunks } from "@/lib/documents/chunk";
import { deleteUserFile, readUserFile, saveUserFile } from "@/lib/documents/storage";
import type { DocumentKind, DocumentProcessStatus } from "@prisma/client";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
]);

function kindFromMime(mime: string, hint?: DocumentKind): DocumentKind {
  if (hint) return hint;
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("text/")) return "TEXT";
  return "OTHER";
}

export type DocumentDto = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: DocumentKind;
  processStatus: DocumentProcessStatus;
  errorCode: string | null;
  pageCount: number | null;
  excerpt: string | null;
  createdAt: string;
};

function toDto(row: {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: DocumentKind;
  processStatus: DocumentProcessStatus;
  errorCode: string | null;
  pageCount: number | null;
  textExcerpt: string | null;
  createdAt: Date;
}): DocumentDto {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    kind: row.kind,
    processStatus: row.processStatus,
    errorCode: row.errorCode,
    pageCount: row.pageCount,
    excerpt: row.textExcerpt,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function ingestUploadedFile(
  userId: string,
  input: {
    fileName: string;
    mimeType: string;
    bytes: Buffer;
    kind?: DocumentKind;
    maxBytes: number;
  }
): Promise<DocumentDto> {
  const mime = input.mimeType.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("INVALID_TYPE");
  }
  if (input.bytes.length > input.maxBytes) {
    throw new Error("TOO_LARGE");
  }

  const kind = kindFromMime(mime, input.kind);
  const row = await prisma.uploadedDocument.create({
    data: {
      userId,
      fileName: input.fileName.slice(0, 200),
      mimeType: mime,
      sizeBytes: input.bytes.length,
      kind,
      processStatus: "PROCESSING",
    },
  });

  const ext =
    mime === "application/pdf"
      ? ".pdf"
      : mime.includes("wordprocessingml")
        ? ".docx"
        : mime.startsWith("image/")
          ? mime === "image/png"
            ? ".png"
            : ".jpg"
          : ".bin";

  try {
    const storageKey = await saveUserFile(userId, row.id, input.bytes, ext);
    const processed = processBytes(mime, input.bytes);
    const updated = await prisma.uploadedDocument.update({
      where: { id: row.id },
      data: {
        storageKey,
        processStatus: processed.status,
        extractedText: processed.text,
        textExcerpt: processed.text.slice(0, 1500) || null,
        pageCount: processed.pageCount,
        errorCode: processed.errorCode,
      },
    });
    return toDto(updated);
  } catch {
    const failed = await prisma.uploadedDocument.update({
      where: { id: row.id },
      data: { processStatus: "FAILED", errorCode: "PROCESS_FAILED" },
    });
    return toDto(failed);
  }
}

function processBytes(
  mime: string,
  bytes: Buffer
): {
  status: DocumentProcessStatus;
  text: string;
  pageCount: number | null;
  errorCode: string | null;
} {
  if (mime.startsWith("image/")) {
    return { status: "READY", text: "", pageCount: null, errorCode: null };
  }
  if (mime === "text/plain" || mime === "text/markdown") {
    const text = bytes.toString("utf8").replace(/\u0000/g, "").slice(0, 400_000);
    if (!text.trim()) {
      return {
        status: "FAILED",
        text: "",
        pageCount: null,
        errorCode: "EMPTY_TEXT",
      };
    }
    return { status: "READY", text, pageCount: 1, errorCode: null };
  }
  if (mime === "application/pdf") {
    const { text, pageCount } = extractPdfText(bytes);
    if (!text.trim()) {
      return {
        status: "FAILED",
        text: "",
        pageCount,
        errorCode: "PDF_NO_TEXT",
      };
    }
    return { status: "READY", text, pageCount, errorCode: null };
  }
  if (mime.includes("wordprocessingml")) {
    const text = extractDocxText(bytes);
    if (!text.trim()) {
      return {
        status: "FAILED",
        text: "",
        pageCount: null,
        errorCode: "DOCX_NO_TEXT",
      };
    }
    return { status: "READY", text, pageCount: 1, errorCode: null };
  }
  return {
    status: "FAILED",
    text: "",
    pageCount: null,
    errorCode: "UNSUPPORTED",
  };
}

export async function retryDocumentProcessing(userId: string, id: string) {
  const row = await prisma.uploadedDocument.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  if (!row.storageKey) throw new Error("NO_FILE");
  const bytes = await readUserFile(row.storageKey);
  if (!bytes) {
    await prisma.uploadedDocument.update({
      where: { id },
      data: { processStatus: "FAILED", errorCode: "FILE_MISSING" },
    });
    throw new Error("FILE_MISSING");
  }
  await prisma.uploadedDocument.update({
    where: { id },
    data: { processStatus: "PROCESSING", errorCode: null },
  });
  const processed = processBytes(row.mimeType, bytes);
  return prisma.uploadedDocument.update({
    where: { id },
    data: {
      processStatus: processed.status,
      extractedText: processed.text,
      textExcerpt: processed.text.slice(0, 1500) || null,
      pageCount: processed.pageCount,
      errorCode: processed.errorCode,
    },
  });
}

export async function listUploadedDocuments(userId: string) {
  const rows = await prisma.uploadedDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(toDto);
}

export async function deleteUploadedDocument(userId: string, id: string) {
  const row = await prisma.uploadedDocument.findFirst({ where: { id, userId } });
  if (!row) throw new Error("NOT_FOUND");
  await deleteUserFile(row.storageKey);
  await prisma.uploadedDocument.delete({ where: { id } });
}

export async function getReadyDocumentContext(
  userId: string,
  documentIds: string[] | undefined,
  query: string
): Promise<{
  textBlock: string;
  images: { mimeType: string; base64: string; fileName: string }[];
  missing: string[];
  failed: string[];
}> {
  const ids = (documentIds ?? []).slice(0, 5);
  const latest = await prisma.uploadedDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const selected = ids.length
    ? latest.filter((d) => ids.includes(d.id))
    : latest.slice(0, 3);

  const missing: string[] = [];
  const failed: string[] = [];
  const images: { mimeType: string; base64: string; fileName: string }[] = [];
  const texts: string[] = [];

  for (const doc of selected) {
    if (doc.processStatus === "FAILED") {
      failed.push(doc.fileName);
      continue;
    }
    if (doc.processStatus !== "READY") {
      missing.push(doc.fileName);
      continue;
    }
    if (doc.kind === "IMAGE" || doc.mimeType.startsWith("image/")) {
      if (!doc.storageKey) {
        failed.push(doc.fileName);
        continue;
      }
      const bytes = await readUserFile(doc.storageKey);
      if (!bytes) {
        failed.push(doc.fileName);
        continue;
      }
      if (bytes.length > 4_500_000) {
        failed.push(doc.fileName);
        continue;
      }
      images.push({
        mimeType: doc.mimeType,
        base64: bytes.toString("base64"),
        fileName: doc.fileName,
      });
      continue;
    }
    const source = doc.extractedText || doc.textExcerpt || "";
    if (!source.trim()) {
      failed.push(doc.fileName);
      continue;
    }
    const chunks = retrieveChunks(source, query, 4);
    texts.push(
      `Document "${doc.fileName}"${doc.pageCount ? ` (${doc.pageCount} pages)` : ""}:\n${chunks.join("\n---\n")}`
    );
  }

  return {
    textBlock: texts.join("\n\n"),
    images,
    missing,
    failed,
  };
}
