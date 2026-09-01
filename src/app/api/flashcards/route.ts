import { getCurrentUser } from "@/lib/auth";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import {
  createFlashcardDeck,
  listFlashcardDecks,
  reviewFlashcard,
} from "@/services/study-tools.service";
import { getRequestContext, isAllowedOrigin } from "@/lib/security/request";
import { z } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok(await listFlashcardDecks(user.id));
  } catch {
    return serverError("Could not load decks.");
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await request.json().catch(() => null);
    const parsed = z
      .object({
        title: z.string().trim().min(1).max(120),
        subject: z.string().trim().max(100).optional(),
        cards: z
          .array(
            z.object({
              front: z.string().trim().min(1).max(2000),
              back: z.string().trim().min(1).max(2000),
            })
          )
          .max(100)
          .optional(),
      })
      .safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    return ok(await createFlashcardDeck(user.id, parsed.data));
  } catch {
    return serverError("Could not create deck.");
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!isAllowedOrigin(ctx.origin)) {
      return fail("Invalid origin", { code: "FORBIDDEN", status: 403 });
    }
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await request.json().catch(() => null);
    const parsed = z
      .object({
        cardId: z.string().cuid(),
        know: z.boolean(),
      })
      .safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }
    return ok(
      await reviewFlashcard(user.id, parsed.data.cardId, parsed.data.know)
    );
  } catch (error) {
    if (String(error).includes("NOT_FOUND")) {
      return fail("Not found", { code: "NOT_FOUND", status: 404 });
    }
    return serverError("Could not review card.");
  }
}
