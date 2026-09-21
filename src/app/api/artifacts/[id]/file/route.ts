import { getCurrentUser } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";
import { getArtifactFile } from "@/services/artifacts.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  const file = await getArtifactFile(user.id, id);
  if (!file) {
    return fail("File not found", { code: "NOT_FOUND", status: 404 });
  }
  const bytes = file.bytes;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.row.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
