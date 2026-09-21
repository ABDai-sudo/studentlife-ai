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
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

export async function readUserFile(storageKey: string): Promise<Buffer | null> {
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
  if (!storageKey) return;
  try {
    const abs = path.join(process.cwd(), storageKey);
    await unlink(abs);
  } catch {
    // ignore missing files
  }
}
