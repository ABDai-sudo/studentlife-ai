/**
 * Selfie avatar helpers — square JPEG data URLs stored on the profile,
 * plus allowlisted curated StudentLife identity stills.
 * Not a Bitmoji clone; uses the student's own photo as their face.
 */

export const AVATAR_SELFIE_MAX_CHARS = 120_000;
export const AVATAR_SELFIE_SIZE_PX = 384;
export const AVATAR_SELFIE_QUALITY = 0.72;

export const CURATED_AVATAR_IMAGE_PATHS = [
  "/login/student-male.png",
  "/login/student-female.png",
  "/login/student-neutral.png",
  "/login/student-custom.png",
] as const;

const CURATED_PATH_SET = new Set<string>(CURATED_AVATAR_IMAGE_PATHS);

const DATA_URL_RE =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i;

export function isCuratedAvatarImagePath(
  value: string | null | undefined
): boolean {
  return Boolean(value && CURATED_PATH_SET.has(value));
}

export function isAvatarSelfieDataUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.length > AVATAR_SELFIE_MAX_CHARS) return false;
  return DATA_URL_RE.test(value);
}

export function normalizeAvatarSelfieInput(
  value: string | null | undefined
): string | null {
  if (value == null || value === "") return null;
  const trimmed = value.trim();
  if (isCuratedAvatarImagePath(trimmed)) return trimmed;
  if (!isAvatarSelfieDataUrl(trimmed)) {
    throw new Error("INVALID_AVATAR_SELFIE");
  }
  return trimmed;
}

/** Browser-only: crop to square cover and compress as JPEG data URL. */
export async function compressSelfieFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("INVALID_AVATAR_SELFIE");
  }
  const bitmap = await createImageBitmap(file);
  const size = AVATAR_SELFIE_SIZE_PX;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("INVALID_AVATAR_SELFIE");
  }
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const drawW = bitmap.width * scale;
  const drawH = bitmap.height * scale;
  const dx = (size - drawW) / 2;
  const dy = (size - drawH) / 2;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, dx, dy, drawW, drawH);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", AVATAR_SELFIE_QUALITY);
  if (!isAvatarSelfieDataUrl(dataUrl)) {
    throw new Error("INVALID_AVATAR_SELFIE");
  }
  return dataUrl;
}
