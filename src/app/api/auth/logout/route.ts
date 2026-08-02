import { logoutUser } from "@/services/auth.service";
import { ok, serverError } from "@/lib/api";

export async function POST() {
  try {
    await logoutUser();
    return ok({ loggedOut: true });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return serverError();
  }
}
