import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";

const ROOT = path.join(process.cwd(), "data", "user-files");

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "x";
}

export function userFilePath(userId: string, id: string, ext = "") {
  return path.join(ROOT, safeSegment(userId), `${safeSegment(id)}${ext}`);
}

export async function saveUserFile(
  userId: string,
  id: string,
  bytes: Buffer,
  ext = ""
): Promise<string> {
  const filePath = userFilePath(userId, id, ext);
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
    return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
  } catch {
    if (bytes.length > 1_500_000) throw new Error("FILE_STORE_FAILED");
    return `inline:${bytes.toString("base64")}`;
  }
}

export async function readUserFile(storageKey: string): Promise<Buffer | null> {
  if (storageKey.startsWith("inline:")) {
    const bytes = Buffer.from(storageKey.slice("inline:".length), "base64");
    return bytes.length ? bytes : null;
  }
  try {
    const abs = path.isAbsolute(storageKey)
      ? storageKey
      : path.join(process.cwd(), storageKey);
    if (!abs.startsWith(ROOT) && !abs.replaceAll("\\", "/").includes("/data/user-files/")) {
      return null;
    }
    return await readFile(abs);
  } catch {
    return null;
  }
}

export async function deleteUserFile(storageKey: string | null | undefined) {
  if (!storageKey || storageKey.startsWith("inline:")) return;
  try {
    const abs = path.join(process.cwd(), storageKey);
    await unlink(abs);
  } catch {
    // ignore missing files
  }
}
